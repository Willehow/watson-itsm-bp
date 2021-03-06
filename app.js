/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var watson = require('watson-developer-cloud'); // watson sdk
var nodemailer = require('nodemailer'); //envio de email
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

//app.use(express.static(path.join(__dirname, 'public')));

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper

var conversation = new watson.ConversationV1({
  // If unspecified here, the ASSISTANT_USERNAME and ASSISTANT_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  username: process.env.ASSISTANT_USERNAME || '<username>',
  password: process.env.ASSISTANT_PASSWORD || '<password>',
  version_date: '2018-02-16'
});

var textoEmail = '';
var filePath = '';
var transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: 'willehow@yahoo.com.br',
    pass: 'd12M10A85'
  }
});



// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/assistant-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };


  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }

    if (data.intents && data.intents[0]) {
      var intencao = data.intents[0];
      console.log('Antes de verificar: '+intencao.intent);



      if(intencao.intent == 'contabilizar'){


        textoEmail = data.output.text[0];
        console.log('Texto email: '+textoEmail);

      }

      //Aqui vai verificar se é chamado e enviar email
      if(intencao.intent == 'confirmar'){

        console.log('Verificado, enviando email: '+intencao.intent);
        console.log('Texto email: '+textoEmail);

        if(filePath != ''){
          var mailOptions = {
            from: 'willehow@yahoo.com.br',
            to: 'willehow@gmail.com',
            subject: 'Teste de email com watson',
            text: textoEmail.toString(),
            attachments: [
              {   // filename and content type is derived from path
                  path: filePath
              }
            ]
          };
        } else {

          var mailOptions = {
            from: 'willehow@yahoo.com.br',
            to: 'willehow@gmail.com',
            subject: 'Teste de email com watson',
            text: textoEmail.toString()
          };

        }

        console.log(mailOptions);

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
            //remove o arquivo
            fs.unlinkSync(filePath);
            filePath = '';
          }
        });






      }
    }

    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
    return response;
  }
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    if (intent.confidence >= 0.75) {
      responseText = 'I understood your intent was ' + intent.intent;
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}






app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    //fs.rename(file.path, path.join(form.uploadDir, '1'+path.extname(file.name))); //esse caso pega a extensao do nome do arquivo
    filePath = path.join(form.uploadDir, file.name);
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.end('success');
  });

  // parse the incoming request containing the form data
  form.parse(req);

});


module.exports = app;
