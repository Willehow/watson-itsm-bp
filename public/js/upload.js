
//$('.upload-btn').hide();

$('.upload-btn').on('click', function (){
    $('#upload-input').click();
});
/*
$('.upload-btn').on('click', function (){
  $('.upload-btn').hide();
  //$('.upload-btn').show();
});
*/
$('#upload-input').on('change', function(){

  var files = $(this).get(0).files;

  if (files.length > 0){
    // create a FormData object which will be sent as the data payload in the
    // AJAX request
    var formData = new FormData();

    // loop through all the selected files and add them to the formData object
    for (var i = 0; i < files.length; i++) {
      var file = files[i];

      // add the files to formData object for the data payload
      formData.append('uploads[]', file, file.name);
    }

    //esconde o botao depois do upload
    $('.upload-btn').hide();

    $.ajax({
      url: '/upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      success: function(data){
          console.log('upload successful!\n' + data);
      },
      xhr: function() {
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        return xhr;
      }
    });

  }
});
