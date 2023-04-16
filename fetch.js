const mouseGrid = document.getElementById('mice');

const pushEntriesToGrid = (arrayOfEntries) => {
	arrayOfEntries.map((entry) => {
		const mousePicture = document.createElement('img');
		mousePicture.src = entry.url;
	
		mouseGrid.appendChild(mousePicture);
	});

	// remove loading image
	document.getElementById('loading').remove();
};

fetch(
	`https://api.reddit.com/r/PetMice/search.json?q=flair%3A%22Adorable%22&restrict_sr=on&sort=top&t=week&limit=100`
  )
	.then((res) => res.json())
	.then((data) => data.data.children.map((data) => data.data))
	.then((array) => pushEntriesToGrid(array))
	// to get error
	.catch((err) => console.log(err))

// these work
// http://www.reddit.com/search.json?q=mice&limit=100
// https://www.reddit.com/search.json?q=mice&limit=100&raw_json=1
// https://www.reddit.com/r/PetMice/search?q=mice&api_type=json
// https://www.reddit.com/r/PetMice/top.json?sort=top&show=all&t=all&limit=100
// https://www.reddit.com/r/PetMice/top.json?f=flair_name%3A"Adorable Photo%2FVid"



// best chance
//https://www.reddit.com/r/PetMice/search.json?q=flair%3A%22Adorable%22&restrict_sr=on&sort=top&t=week&limit=100
//https://api.reddit.com/r/PetMice/search.json?q=flair%3A%22Adorable%22&restrict_sr=on&sort=top&t=week&limit=100
