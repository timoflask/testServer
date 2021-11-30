const express = require('express')
const app = express()
const cors = require('cors')
const fs = require('fs')
const axios = require('axios')
const pretty = require('pretty')
const puppeteer = require('puppeteer')

// CORS Origin
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(express.json())
app.use(cors())

const url = 'https://dappradar.com/nft/collections/1';
const startTableTag = "<div d=\"row\" class="
const endTableTag = "</div><div class=\"sc-eXlEPa iBSJzd\">"

let collectionArrays = []

async function takeScreenshot() {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto(url)
    const data = await page.evaluate(() => document.querySelector('*').outerHTML)

    var start = "<div d=\"row\" class=\"sc-kTLmzF ctxVvg\">"
    var end = "</div><div class=\"sc-eXlEPa iBSJzd\">"

    var result = getMiddleContent(start, end, data)
    var indices = getIndicesOf(start, result)

    console.log(indices)

    for (var i=0; i<indices.length; i++) {
      if (i == indices.length-1) {
        var split = result.substring(indices[i], indices.length)
        var obj = {}
        getCollectionObject(split, obj)
        collectionArrays.push(obj)
      } else {
        var split = result.substring(indices[i], indices[i+1])
        var obj = {}
        getCollectionObject(split, obj)
        collectionArrays.push(obj)
      }
    }

    console.log("arraysasdasd", collectionArrays)
    // const data = await page.evaluate(() => document.getElementsByClassName('sc-gjNHFA').outerHTML);
    // console.log(data)

    // console.log('Hello')
    // const data = fs.readFileSync("./helloworld.txt", 'utf8');
    
    await browser.close()
  } catch(error) {
    console.error(error)
  }
}

function getMiddleContent(start, end, str) {
  var firstIndex = str.indexOf(start)
  var endIndex = str.indexOf(end)
  var result = str.substring(firstIndex, endIndex)
  return result;
}

function getIndicesOf(searchStr, str, caseSensitive) {
  var searchStrLen = searchStr.length;
  if (searchStrLen == 0) {
      return [];
  }
  var startIndex = 0, index, indices = [];
  if (!caseSensitive) {
      str = str.toLowerCase();
      searchStr = searchStr.toLowerCase();
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
      indices.push(index);
      startIndex = index + searchStrLen;
  }
  return indices;
}

function getTagContent(specialID, source) {
  var startIndex = source.indexOf(specialID)
  var split = source.substring(startIndex)
  var startTagIndex = split.indexOf(">")
  var endTagIndex = split.indexOf("</")
  var result = split.substring(startTagIndex, endTagIndex).replace("</", "")

  return result;
}

function getCollectionObject(input, outputObj) {
  var floorTag = "__nft-floor-price\">"
  var averageTag = "__nft-avg-sale\">"
  var capTag = "__nft-cap\">"
  var volumeTag = "__nft-volume\">"
  var traderTag = "__nft-traders\">"
  var salesTag = "__nft-sales\">"

  var valueTag = "<div class=>"
  var percentTag = "</div><div class="
  var endTag = "</div></div>"

  var name = ""
  var newCollection = ""
  if (input.indexOf("New</div>") != -1) {
    newCollection = "yes"
    // name = getTagContent("New</", input)
    var index = input.indexOf("</", input.indexOf("New</div>") + "New</div>".length)
    name = input.substring(input.indexOf("New</div>"), index)
    name = name.replace("New</div>", "")
  } else {
    newCollection = "no"
    // name = getTagContent("nft-name-link", input)
    var namePart = getMiddleContent("<a", "</a>", input)
    name = namePart.substring(namePart.indexOf("\">"), namePart.length)
    name = name.replace("\">", "")
  }

  var floorPriceContent = getMiddleContent(floorTag, averageTag, input)
  console.log("floorPrice", floorPriceContent)
  var floorPrice = getMiddleContent(valueTag, percentTag, floorPriceContent)
  .replace(valueTag, "").replace(floorTag, "")
  floorPrice = floorPrice.replace(floorPrice.substring(floorPrice.indexOf("<"), floorPrice.indexOf(">")), "").replace(">", "")
  var idx = floorPriceContent.lastIndexOf("\">")
  var endIdx = floorPriceContent.lastIndexOf("</div></div>")
  var floorPercent = floorPriceContent.substring(idx, endIdx).replace("\">", "")

  var averageContent = getMiddleContent(averageTag, capTag, input)
  var averagePrice = getMiddleContent(valueTag, percentTag, averageContent).replace(valueTag, "").replace(averageTag, "")
  averagePrice = averagePrice.replace(averagePrice.substring(averagePrice.indexOf("<"), averagePrice.indexOf(">")), "").replace(">", "")
  var averagePercent = averageContent.substring(averageContent.lastIndexOf("\">"), averageContent.lastIndexOf("</div></div>")).replace("\">", "")

  var capContent = getMiddleContent(capTag, volumeTag, input)
  var capPrice = getMiddleContent(valueTag, percentTag, capContent).replace(valueTag, "").replace(capTag, "")
  capPrice = capPrice.replace(capPrice.substring(capPrice.indexOf("<"), capPrice.indexOf(">")), "").replace(">", "")
  var capPercent = capContent.substring(capContent.lastIndexOf("\">"), capContent.lastIndexOf("</div></div>")).replace("\">", "")

  var volumeContent = getMiddleContent(volumeTag, traderTag, input)
  console.log("volumeContent", volumeContent)
  var volumePrice = getMiddleContent(valueTag, percentTag, volumeContent).replace(valueTag, "").replace(volumeTag, "")
  volumePrice = volumePrice.replace(volumePrice.substring(volumePrice.indexOf("<"), volumePrice.indexOf(">")), "").replace(">", "")
  var volumePercent = volumeContent.substring(volumeContent.lastIndexOf("\">"), volumeContent.lastIndexOf("</div></div>")).replace("\">", "")

  var traderContent = getMiddleContent(traderTag, salesTag, input)
  var traderPrice = getMiddleContent(valueTag, percentTag, traderContent).replace(valueTag, "").replace(traderTag, "")
  traderPrice = traderPrice.replace(traderPrice.substring(traderPrice.indexOf("<"), traderPrice.indexOf(">")), "").replace(">", "")
  var traderPercent = traderContent.substring(traderContent.lastIndexOf("\">"), traderContent.lastIndexOf("</div></div>")).replace("\">", "")

  var salesIndex = input.indexOf(salesTag)
  var salesContent = input.substring(salesIndex, input.length)
  var salesPrice = getMiddleContent(valueTag, percentTag, salesContent).replace(valueTag, "").replace(salesTag, "")
  salesPrice = salesPrice.replace(salesPrice.substring(salesPrice.indexOf("<"), salesPrice.indexOf(">")), "").replace(">", "")
  var salesPercent = salesContent.substring(salesContent.lastIndexOf("\">"), salesContent.lastIndexOf("</div></div>")).replace("\">", "").replace("</div>", "")

  outputObj["name"] = name
  outputObj["new"] = newCollection
  outputObj["floorPrice"] = floorPrice
  outputObj["floorPercent"] = floorPercent
  outputObj["averagePrice"] = averagePrice
  outputObj["averagePercent"] = averagePercent
  outputObj["capPrice"] = capPrice
  outputObj["capPercent"] = capPercent
  outputObj["volumePrice"] = volumePrice
  outputObj["volumePercent"] = volumePercent
  outputObj["traderPrice"] = traderPrice
  outputObj["traderPercent"] = traderPercent
  outputObj["salesPrice"] = salesPrice
  outputObj["salesPercent"] = salesPercent
}

async function getCollectionInfos(url)
{
  const browser =  await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)
  const data = await page.evaluate(() => document.querySelector('*').outerHTML)

  var result = data.substring(data.indexOf(startTableTag), data.lastIndexOf(startTableTag))
  var indices = getIndicesOf(startTableTag, result)

  for (var i=0; i<indices.length; i++) {
    var obj = {}
    if (i == indices.length-1) {
      var split = result.substring(indices[i], indices.length)
    } else {
      var split = result.substring(indices[i], indices[i+1])
    }
    getCollectionObject(split, obj)
    collectionArrays.push(obj)
  }
  console.log("result", collectionArrays)
  await browser.close()
}

app.post('/collections', async (req, res) => {
  try {
    collectionArrays = []

    const url = req.body.target
    console.log(url)
    await getCollectionInfos(url)

    res.json({status: true, collections: collectionArrays});
  } catch(error) {
    console.error(error)
    res.json({status: false});
  }
});

app.listen(5001, async () => {
  console.log('REST Server listening on port 5000');
});


//takeScreenshot()