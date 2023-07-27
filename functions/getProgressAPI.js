exports = async function(arg){
  var axios = require('axios');
  try {
          const resp = await axios.get('https://api.url......&apiKey=<api_key>');
          console.log(resp.data[0]); 
      } catch (err) {
          console.error(err);
      }
};