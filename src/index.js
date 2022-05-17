// libraries:
import codes from "./utils/code.js";
import cheerio from "cheerio";
import mysql from "mysql";
import axios from "axios";
import chalk from "chalk";

// create a connection to the database:
let db = mysql.createConnection({
  user: "root",
  host: "localhost",
  database: "proxies",
});

// connect to the database:
db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(chalk.green("Connected to the db"));
  }
});

// insert data into the database:
const insertData = (table, data, country) => {
  db.query(`SELECT ip FROM ${table} WHERE ip= ?`, [data.ip], (err, row) => {
    if (row.length === 0) {
      switch (table) {
        case "http":
          let http = `INSERT INTO http (ip, port, country) VALUES ('${data.ip}', '${data.port}', '${country}')`;
          db.query(http);
          break;
        case "https":
          let https = `INSERT INTO https (ip, port, country) VALUES ('${data.ip}', '${data.port}', '${country}')`;
          db.query(https);
          break;
        case "socks":
          let socks = `INSERT INTO socks (ip, port, type, country) VALUES ('${data.ip}', '${data.port}', '${data.type}', '${country}')`;
          db.query(socks);
          break;
        default:
          console.log("error");
          break;
      }
    } else {
      return;
    }
  });
};

// get base information from the url:
const getBaseInformation = async (country) => {
  const url = `https://www.proxyhub.me/en/${country}-free-proxy-list.html`;
  const response = await axios.get(url);
  if (response.status === 200) {
    const $ = cheerio.load(response.data);
    // get body:
    const body = $("body");
    // get info from the dom:
    let info = {
      pagescount: `${body
        .find(".pagination > li:last-child > span")
        .attr("page")}`,
      proxycount: `${body.find(".info > p").text().split(" ")[2]}`,
      country: `${body.find(".info > h1").text().split(" ")[0]}`,
    };
    // return data:
    return info;
  } else {
    console.log("error");
    return null;
  }
};

// get the proxy list from the url:
let num = 1;
let delay = 1500;
let country = 0;
let status = "progress";

const scrapData = async (country) => {
  const data = await getBaseInformation(country);
  if (data === null) {
    console.log("error");
  } else {
    // show data:
    console.log(
      `Country : ${data.country} | Code : ${data.code} | Proxies : ${data.proxycount}`
    );

    if (parseInt(data.proxycount) < 35) {
      status = "done";
    } else {
      const url = `https://www.proxyhub.me/en/${country}-free-proxy-list.html`;
      // get the proxy list:
      const getPorxy = setInterval(async () => {
        let config = {
          headers: {
            cookie: `page=${num}`,
          },
        };
        let response = await axios.get(url, config);
        if (response.status === 200) {
          const $ = cheerio.load(response.data);
          const body = $("body");
          const table = body.find(".table > tbody").children();
          table.map((index, element) => {
            let row = $(element);
            let proxy = {
              ip: row.find("td:nth-child(1)").text(),
              port: row.find("td:nth-child(2)").text(),
              type: row.find("td:nth-child(3)").text(),
            };
            switch (proxy.type) {
              case "HTTP":
                insertData("http", proxy, country);
                break;
              case "HTTPS":
                insertData("https", proxy, country);
                break;
              case "SOCKS4":
                insertData("socks", proxy, country);
                break;
              case "SOCKS5":
                insertData("socks", proxy, country);
                break;
              default:
                break;
            }
          });
          num += 1;
        } else {
          console.log("error");
        }
        // stop the interval:
        if (num === parseInt(data.pagescount) - 1) {
          clearInterval(getPorxy);
          status = "done";
        }
      }, delay);
    }
  }
};

scrapData(codes[country]);

setInterval(() => {
  if (status === "done") {
    num = 1;
    country += 1;
    status = "progress";
    scrapData(codes[country]);
    console.log(codes[country]);
  }
}, 1000);
