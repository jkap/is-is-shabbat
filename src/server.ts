import express, { Express, Request, Response, NextFunction } from "express";
import { exec } from "child_process";
import bent from "bent";
import moment from "moment-timezone";

const shabbat_url =
  "https://www.hebcal.com/shabbat/?cfg=json&geonameid=5378538&m=50";

const app: Express = express();
app.set("views", "./views");
app.set("view engine", "ejs");
app.engine(".html", require("ejs").renderFile);
const getJSON = bent("json");

let candlesTimer: NodeJS.Timeout = null;
let havdalahTimer: NodeJS.Timeout = null;

interface ShabbatData {
  startDate: Date;
  endDate: Date;
}

interface CandlesData {
  category: "candles";
  date: string;
}

interface HavdalahData {
  category: "havdalah";
  date: string;
}

interface ShabbatAPIResponse {
  items: (CandlesData | HavdalahData)[];
}

function execShellCommand(cmd: string) {
  return new Promise<string>((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

function processShabbatResponse(body: ShabbatAPIResponse): ShabbatData {
  const resp: ShabbatData = { startDate: null, endDate: null };

  body.items.forEach((item) => {
    switch (item.category) {
      case "candles":
        resp.startDate = new Date(item.date);
        break;
      case "havdalah":
        resp.endDate = new Date(item.date);
    }
  });

  return resp;
}

async function stopHandling() {
  await execShellCommand("sudo -n /usr/sbin/ufw deny 443");
  await execShellCommand("sudo -n /usr/sbin/ufw deny 80");
}
async function restartHandling() {
  await execShellCommand("sudo -n /usr/sbin/ufw allow 443");
  await execShellCommand("sudo -n /usr/sbin/ufw allow 80");
}

function setTimers() {
  if (candlesTimer) {
    clearTimeout(candlesTimer);
  }

  if (havdalahTimer) {
    clearTimeout(havdalahTimer);
  }

  let nextCandles = currentShabbatData.startDate.getTime() - Date.now();
  let nextHavdalah = currentShabbatData.endDate.getTime() - Date.now();

  candlesTimer = setTimeout(() => stopHandling, nextCandles);

  havdalahTimer = setTimeout(() => restartHandling, nextHavdalah);
}

let currentShabbatData: ShabbatData = null;

function updateShabbatData() {
  if (
    currentShabbatData?.startDate &&
    currentShabbatData?.endDate &&
    moment().isBetween(currentShabbatData.startDate, currentShabbatData.endDate)
  ) {
    return;
  }
  getJSON(shabbat_url)
    .then(processShabbatResponse)
    .then((resp) => (currentShabbatData = resp))
    .then(() => setTimers());
}

updateShabbatData();
setInterval(() => {
  updateShabbatData();
}, 1000 * 60 * 60 * 24);

app.get("/", (req, res) => {
  res.render("index", {
    shabbatData: currentShabbatData,
    moment: moment,
  });
});

if (process.env.NODE_ENV !== "production") {
  app.get("/toggle", async (req, res) => {
    await stopHandling();
    res.send("askdjfhskd");
  });
}

app.listen(3000);
