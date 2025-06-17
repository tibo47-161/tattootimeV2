const https = require('https');

const functionUrl = 'https://addadminrole-sjjfptg4lq-uc-a.run.app';
const adminEmail = 'tobi196183@gmail.com';

const url = `${functionUrl}/?email=${adminEmail}`;

console.log(`Attempting to call: ${url}`);

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Function response:', data);
    console.log('--------------------------------------------------');
    console.log('If you saw a success message above, your admin role should now be set.');
    console.log('Please log out of your app and log back in.');
  });

}).on('error', (err) => {
  console.error('Error calling function:', err.message);
  console.error('--------------------------------------------------');
  console.error('If you continue to see errors, please ensure your internet connection is stable ');
  console.error('and that the Firebase Function is deployed and active.');
}); 