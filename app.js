const express = require('express');
const app = express();
const fs = require('fs');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const rimraf = require('rimraf');
const router = express.Router();

const worker = createWorker({
    logger: m => console.log(m)
});

// Setup storage options to upload file inside upload directoty
const storage = multer.diskStorage({    
    destination: (req, file, cd) => {
        cd(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
});

// Intailized upload with storage options
const upload = multer({ storage }).single('avatar');

app.set("view engine", "ejs");
app.get('/', (req, res) => res.render('index'))


// Defined API for handle all requests comes on /upload route (or from index's submit btn click)
app.post('/upload', (req, res) => {

    // Stored file into upload directory
    upload(req, res, err => {

        // Reading uploaded file from upload directory
        fs.readFile(`./uploads/${req.file.originalname}`, (err, data) => {

            // Displaying error if anything goes wrong 
            if(err) return console.error("this is error", err);

             // Self execution function to use async await 
              (async () => {
                // Tesseract worker loaded with langague option
                await worker.load();
                await worker.loadLanguage('eng');
                await worker.initialize('eng');

                // Document extraction by recognize method of Tesseract and console result
                const { data: { text } } = await worker.recognize(data);
                console.log(text);

                // Used getPDF method to genrate pdf and stored it into app directory by using writeFileSync method
                const { data : pdfData } = await worker.getPDF('Tesseract OCR Result');
                fs.writeFileSync(`./public/pdf/${req.file.originalname}.pdf`, Buffer.from(pdfData));
                console.log(`Generate PDF: ${req.file.originalname}.pdf`);

;
            
                // to delete files from upload
                rimraf('./uploads/*', function () { console.log('done'); });

                // Respond send to view with result text and terminated worker after porcess complete
                // res.send(text)
                

                // dowload file
                res.download( `./public/pdf/${req.file.originalname}.pdf`);



                // now delete file from public

                rimraf('./public/pdf/*', function () {
                 console.log('done');
                 });

                await worker.terminate();
              })();
        })
     
        
    })
})
const PORT = 5000;
app.listen(PORT, () => console.log("App is running on", PORT))