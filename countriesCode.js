// libraries:
import cheerio from "cheerio";
import axios from "axios";
import fs from "fs";

// fetch countries:
const getCountryList = async () => {
  const url = `https://www.proxyhub.me/`;
  const response = await axios.get(url);
  if (response.status === 200) {
    const $ = cheerio.load(response.data);
    const body = $("body");
    let countryList = body.find(".custom-select").children();
    let countries = {
      codes: [],
    };
    countryList.map((index, element) => {
      let row = $(element).attr("value");
      if (row.length > 2) {
        return;
      } else {
        countries.codes.push(row);
      }
      if (index === countryList.length - 1) {
        fs.writeFile("data.json", JSON.stringify(countries, null, 4), (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    });
  } else {
    console.log("error");
    return null;
  }
};

getCountryList();
