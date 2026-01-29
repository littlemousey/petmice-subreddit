const REDDIT_API_QUERY= 'https://www.reddit.com/r/PetMice/top.json?limit=100&t=week&raw_json=1';
const mouseGrid = document.getElementById('fetched-mice');
const miceGalleries = document.getElementById('mouse-galleries');
const miceImages = document.getElementById('mouse-images');

const pushEntriesToGrid = (arrayOfEntries) => {
    console.log(arrayOfEntries);
    arrayOfEntries.map((entry) => {
        let mediaUrl = null;
        let mediaType = 'image'; // default to image
        
        // Case 1: Direct image posts
        if ((entry.post_hint === 'image') || 
            (entry.url && (entry.url.endsWith('.jpg') || entry.url.endsWith('.jpeg') || 
                          entry.url.endsWith('.png') || entry.url.endsWith('.gif')))) {
            mediaUrl = entry.url;
            mediaType = 'image';
        }
        // Case 2: Video posts
        else if (entry.post_hint === 'hosted:video' || entry.post_hint === 'rich:video') {
            if (entry.media && entry.media.reddit_video && entry.media.reddit_video.fallback_url) {
                mediaUrl = entry.media.reddit_video.fallback_url;
                mediaType = 'video';
            }
            // Fallback to preview image for videos
            else if (entry.preview && entry.preview.images && entry.preview.images.length > 0) {
                const largestPreview = entry.preview.images[0].source;
                mediaUrl = largestPreview.url.replace(/&amp;/g, '&');
                mediaType = 'image';
            }
        }
        // Case 3: Image previews (for link posts that have image previews)
        else if (entry.preview && entry.preview.images && entry.preview.images.length > 0) {
            const largestPreview = entry.preview.images[0].source;
            mediaUrl = largestPreview.url.replace(/&amp;/g, '&');
            mediaType = 'image';
        }
        // Case 4: Gallery posts (first image)
        else if (entry.is_gallery && entry.media_metadata) {
            const mediaIds = Object.keys(entry.media_metadata);
            if (mediaIds.length > 0) {
                const firstMediaId = mediaIds[0];
                const mediaItem = entry.media_metadata[firstMediaId];
                if (mediaItem.s && mediaItem.s.u) {
                    mediaUrl = mediaItem.s.u.replace(/&amp;/g, '&');
                    mediaType = 'image';
                }
            }
        }
        // Case 5: Self posts with thumbnail
        else if (entry.thumbnail && entry.thumbnail !== 'self' && entry.thumbnail !== 'default' && entry.thumbnail !== 'nsfw') {
            mediaUrl = entry.thumbnail;
            mediaType = 'image';
        }
        
        // If we found media, add it to the grid
        if (mediaUrl) {
            const figure = document.createElement('figure');
            
            if (mediaType === 'video') {
                const mouseVideo = document.createElement('video');
                mouseVideo.src = mediaUrl;
                mouseVideo.controls = true;
                mouseVideo.muted = true;
                mouseVideo.loop = true;
                mouseVideo.preload = 'metadata';
                figure.appendChild(mouseVideo);
            } else {
                const mousePicture = document.createElement('img');
                mousePicture.src = mediaUrl;
                // Add error handling for images that fail to load
                mousePicture.onerror = function() {
                    figure.remove();
                };
                figure.appendChild(mousePicture);
            }
            
            // Add title as figcaption
            const figCaption = document.createElement('figcaption');
            figCaption.textContent = entry.title;
            figure.appendChild(figCaption);
        
            miceImages.appendChild(figure);
        }

        return;
    });

    // remove loading image with null check
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    if (loadingPlaceholder) {
        loadingPlaceholder.remove();
    }
    mouseGrid.classList.remove('to-be-loaded');
    document.getElementsByTagName('body')[0].classList.remove('loading');
};

// Add timeout wrapper function
const fetchWithTimeout = (url, timeout = 15000) => {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
};

// Show error message function
const showErrorMessage = (err, retryCallback) => {
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    if (loadingPlaceholder) {
        loadingPlaceholder.innerHTML = `
            <p>Error: ${err}</p>
            <button id="retry-btn" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-top: 10px;">
                Retry Loading
            </button>
        `;
        
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn && retryCallback) {
            retryBtn.addEventListener('click', retryCallback);
        }
    }
    mouseGrid.classList.remove('to-be-loaded');
    document.getElementsByTagName('body')[0].classList.remove('loading');
};

// Fetch function with retry logic
const fetchMice = (retryCount = 0, maxRetries = 3) => {
    // Show retry attempt in loading message
    const loadingPlaceholder = document.getElementById('loading-placeholder');
    if (retryCount > 0 && loadingPlaceholder) {
        const loadingText = loadingPlaceholder.querySelector('p');
        if (loadingText) {
            loadingText.textContent = `Retrying... (Attempt ${retryCount + 1}/${maxRetries + 1})`;
        }
    }

    // Fixes CORS Errors
    fetchWithTimeout(
        `https://cors-anywhere.com/${REDDIT_API_QUERY}`,
        15000 + (retryCount * 5000) // Increase timeout with each retry
    )
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then((data) => {
            if (!data.data || !data.data.children) {
                throw new Error('Invalid response format');
            }
            return data.data.children.map((data) => data.data);
        })
        .then((array) => {
            if (array.length === 0) {
                throw new Error('No posts found');
            }
            pushEntriesToGrid(array);
        })
        .catch((err) => {
            console.error('Fetch error:', err);
            
            // Retry logic
            if (retryCount < maxRetries) {
                console.log(`Retrying... attempt ${retryCount + 1} of ${maxRetries}`);
                setTimeout(() => fetchMice(retryCount + 1, maxRetries), 2000 * (retryCount + 1)); // Exponential backoff
            } else {
                showErrorMessage(err.message, () => {
                    // Reset UI for manual retry
                    const loadingPlaceholder = document.getElementById('loading-placeholder');
                    if (loadingPlaceholder) {
                        loadingPlaceholder.innerHTML = `
                            <img id="loading-img" alt="loading" src="./assets/loading-mouse.gif" />
                            <p>Hold on, mice incoming...</p>
                        `;
                    }
                    document.getElementsByTagName('body')[0].classList.add('loading');
                    fetchMice(0, maxRetries); // Start fresh retry
                });
            }
        });
};

// Start the initial fetch
fetchMice();

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