
fetch('https://7pet-mvp-production.up.railway.app/emergency/users?secret=7pet-rescue')
    .then(r => r.json())
    .then(j => {
        console.log('DB_URL:', j.dbUrl);
        console.log('ERROR:', j.error);
    })
    .catch(console.error);
