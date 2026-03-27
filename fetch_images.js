const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'highlander_club_images');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(path.join(targetDir, filename), Buffer.from(buffer));
    console.log(`✅ Downloaded: ${filename}`);
  } catch (err) {
    console.error(`❌ Failed to download ${filename}:`, err.message);
  }
}

async function run() {
  try {
    const res = await fetch('https://highlanderlink.ucr.edu/api/discovery/search/organizations?top=50');
    const data = await res.json();
    
    let count = 0;
    for (const org of data.value) {
      if (org.ProfilePicture) {
        // usually ProfilePicture is an ID or a relative URL like `/organization/123/profilepicture`
        let imgUrl = org.ProfilePicture;
        if (!imgUrl.startsWith('http')) {
          imgUrl = `https://se-images.campuslabs.com/clink/images/${org.ProfilePicture}?preset=med-sq`;
          // Sometimes it is stored in campuslabs cdn. Let's try appending the ID to campuslabs images.
          // Wait, actually, CampusLabs API usually provides the ProfilePicture string as the image UUID, e.g. "a1b2c3d4-..."
        }
        
        // Campuslabs discovery API stores pictures in https://se-images.campuslabs.com/clink/images/{ProfilePicture}?preset=med-sq
        const url = imgUrl.includes('http') ? imgUrl : `https://se-images.campuslabs.com/clink/images/${org.ProfilePicture}?preset=med-sq`;
        
        const ext = 'jpg';
        const cleanName = org.Name.replace(/[^a-zA-Z0-9]/g, '_');
        await downloadImage(url, `${cleanName}.${ext}`);
        count++;
      }
    }
    console.log(`🎉 Finished downloading ${count} images.`);
  } catch (err) {
    console.error('Error fetching organizations:', err);
  }
}

run();
