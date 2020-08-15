const express = require("express");
const { convert } = require("convert-svg-to-png");
const archiver = require("archiver");
const fs = require('fs')
const PORT = process.env.PORT || 3000;

if (!fs.existsSync("./images")) fs.mkdir("images", function(err){});

let app = express();

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static("public"))

app.get('/images/:archive', (req, res)=>
{
    let filePath = __dirname + "/images/" + req.params.archive;
    if (fs.existsSync(filePath))
    {
        res.download(filePath, req.params.archive);
        setTimeout( ()=> { fs.unlinkSync(filePath) }, 30*1000); // second to download the file
    }
    else
    {
        res.sendStatus(404);
    }
})

app.post("/convert", (req, res)=>
{
    let d = new Date;
    d = d.toISOString().replace(/[,:.]/gi, "-");
    let archivePath = __dirname + "/images/"+d+".zip";
    var output = fs.createWriteStream(archivePath);
    var archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    let svgArray = req.body;
    let promisesToWait = [];
    console.log("--- new files incoming ---")
    svgArray.forEach( (elem) =>
    {
        console.log(elem.name)
        promisesToWait.push(
            convert(elem.svg, {height:500, width:500})
            .then((rawData)=>{
                archive.append(rawData, {name: elem.name+".png"})
            }
        ));
    });
    Promise.all(promisesToWait)
    .then(()=>{
        archive.finalize();
        res.send("/images/"+d+".zip");
    });
})

app.get('/', (req, res)=> res.sendFile(__dirname + "public/index.html"));

app.listen(PORT);