const REDDIT_BASE_URL = 'https://www.reddit.com';
const mouseGrid = document.getElementById('fetched-mice');
const miceGalleries = document.getElementById('mouse-galleries');
const miceImages = document.getElementById('mouse-images');

const pushEntriesToGrid = (arrayOfEntries) => {
	console.log(arrayOfEntries);
	arrayOfEntries.map((entry) => {
		if (entry.post_hint === 'image') {
			const mousePicture = document.createElement('img');
			mousePicture.src = entry.url;
			const figure = document.createElement('figure');
			figure.appendChild(mousePicture);
			
			// Add title as figcaption
			const figCaption = document.createElement('figcaption');
			figCaption.textContent = entry.title;
			figure.appendChild(figCaption);
		
			miceImages.appendChild(figure);
		}

		if (entry.is_gallery) {
			const urlGallery = document.createElement('a');
			urlGallery.setAttribute('href', `${REDDIT_BASE_URL}${entry.permalink}`);
			const block = document.createElement("blockquote");
			block.classList.add('reddit-embed-bq');
			block.setAttribute('data-embed-height', 678);
			block.style.height = "500px";
			block.appendChild(urlGallery);
			miceGalleries.appendChild(block);
		}

		return;
	});

	// remove loading image
	document.getElementById('loading-placeholder').remove();
	mouseGrid.classList.remove('to-be-loaded');
	document.getElementsByTagName('body')[0].classList.remove('loading');
};

fetch(
	`https://api.reddit.com/r/PetMice/search.json?q=flair%3A"Cute%20Mouse%20Media"&restrict_sr=on&sort=top&t=month&limit=100`
  )
	.then((res) => res.json())
	.then((data) => data.data.children.map((data) => data.data))
	.then((array) => pushEntriesToGrid(array))
	// to get error
	.catch((err) => console.log(err))
	.then(() => loadWidgetScript())

const loadWidgetScript = () => {
	const scriptPromise = new Promise((resolve, reject) => {
		const embedScript = document.createElement('script');
		document.body.appendChild(embedScript);
		embedScript.onload = resolve;
		embedScript.onerror = reject;
		embedScript.async = true;
		embedScript.src = 'https://embed.reddit.com/widgets.js';
	});

	scriptPromise.catch((err) => {
		console.error(err);
	});
}


// these work
// http://www.reddit.com/search.json?q=mice&limit=100
// https://www.reddit.com/search.json?q=mice&limit=100&raw_json=1
// https://www.reddit.com/r/PetMice/search?q=mice&api_type=json
// https://www.reddit.com/r/PetMice/top.json?sort=top&show=all&t=all&limit=100
// https://www.reddit.com/r/PetMice/top.json?f=flair_name%3A"Adorable Photo%2FVid"

// old
// https://api.reddit.com/r/PetMice/search.json?q=flair%3A%22Adorable%22&restrict_sr=on&sort=top

// best chance
//https://www.reddit.com/r/PetMice/search.json?q=flair%3A%22Adorable%22&restrict_sr=on&sort=top&t=week&limit=100
//https://api.reddit.com/r/PetMice/search.json?q=flair%3A%22Adorable%22&restrict_sr=on&sort=top&t=week&limit=100
