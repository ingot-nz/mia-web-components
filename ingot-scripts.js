// Configuration: Replace with your Google Sheet published CSV URLs
// To get these URLs:
// 1. In Google Sheets, go to File > Share > Publish to web
// 2. Select the specific sheet tab (e.g., "Home Hero Carousel") and choose "Comma-separated values (.csv)"
// 3. Click Publish and copy the URL
// 4. Repeat for each sheet tab
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcFCl8wWVnh4CUBuZig_1xrDjl_oaLELxa3tZHqa4shBr6Ff9ffiKPhcjx5cBXdy3YYV_JkoHmIHnn/pub?output=csv';
const VIDEO_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcFCl8wWVnh4CUBuZig_1xrDjl_oaLELxa3tZHqa4shBr6Ff9ffiKPhcjx5cBXdy3YYV_JkoHmIHnn/pub?gid=2124855345&single=true&output=csv';
const MEMBER_LOGOS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcFCl8wWVnh4CUBuZig_1xrDjl_oaLELxa3tZHqa4shBr6Ff9ffiKPhcjx5cBXdy3YYV_JkoHmIHnn/pub?gid=1102148999&single=true&output=csv';

let currentSlide = 0;
let images = [];
let autoplayInterval;

async function fetchImagesFromGoogleSheet() {
    try {
        // ========================================
        // PRODUCTION NOTE: Remove CORS proxy when deploying to production server
        // Replace the next two lines with: const url = GOOGLE_SHEET_CSV_URL;
        // ========================================
        const proxyUrl = 'https://corsproxy.io/?';
        const url = proxyUrl + encodeURIComponent(GOOGLE_SHEET_CSV_URL);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'text/csv'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data from Google Sheet (Status: ${response.status})`);
        }
        
        const csvText = await response.text();
        console.log('CSV data received:', csvText); // Debug log
        
        const rows = csvText.split('\n').slice(1); // Skip header row
        
        images = rows
            .filter(row => row.trim() !== '')
            .map(row => {
                const columns = parseCSVRow(row);
                return {
                    url: columns[0]?.trim() || '',
                    alt: columns[1]?.trim() || 'Gallery image'
                };
            })
            .filter(img => img.url !== '');

        console.log('Parsed images:', images); // Debug log

        if (images.length === 0) {
            throw new Error('No images found in the Google Sheet');
        }

        buildCarousel();
    } catch (error) {
        console.error('Error fetching images:', error);
        console.error('Error details:', error.message);
        document.getElementById('carousel').innerHTML = 
            `<div class="error">
                <p>Error loading images.</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Error: ${error.message}</p>
                <p style="font-size: 0.8rem; margin-top: 10px;">Try opening via a local web server or check browser console (F12)</p>
            </div>`;
    }
}

function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

function buildCarousel() {
    const carousel = document.getElementById('carousel');
    
    // Create slides HTML
    const slidesHTML = images.map((img, index) => `
        <div class="carousel-slide ${index === 0 ? 'active' : ''}">
            <img src="${img.url}" alt="${img.alt}" />
        </div>
    `).join('');

    // Create indicators HTML
    const indicatorsHTML = images.map((_, index) => `
        <span class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `).join('');

    // Build carousel structure
    carousel.innerHTML = `
        ${slidesHTML}
        <div class="carousel-indicators">
            ${indicatorsHTML}
        </div>
    `;

    // Add event listeners for indicators

    document.querySelectorAll('.indicator').forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            goToSlide(index);
            resetAutoplay();
        });
    });

    // Start autoplay with longer initial delay
    setTimeout(() => {
        startAutoplay();
    }, 4000); // Wait 4 seconds before starting autoplay
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');

    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = (currentSlide + direction + images.length) % images.length;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');

    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = index;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

function startAutoplay() {
    autoplayInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // Change slide every 5 seconds
}

function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
}

// Initialize carousels when page loads
fetchImagesFromGoogleSheet();
fetchVideoContentBox();
fetchMemberLogos();

// Fetch Video Content Box data from Google Sheet
async function fetchVideoContentBox() {
    try {
        // ========================================
        // PRODUCTION NOTE: Remove CORS proxy when deploying to production server
        // ========================================
        const proxyUrl = 'https://corsproxy.io/?';
        const url = proxyUrl + encodeURIComponent(VIDEO_SHEET_CSV_URL);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch video data');
        }
        
        const csvText = await response.text();
        console.log('Video CSV data received:', csvText);
        
        const rows = csvText.split('\n').slice(1); // Skip header row
        
        if (rows.length > 0 && rows[0].trim() !== '') {
            const columns = parseCSVRow(rows[0]);
            const videoUrl = columns[0]?.trim() || '';
            const displayVideo = columns[1]?.trim().toLowerCase() === 'yes';
            
            console.log('Video URL:', videoUrl);
            console.log('Display Video:', displayVideo);
            
            buildVideoContentBox(videoUrl, displayVideo);
        } else {
            console.log('No video data found');
        }
    } catch (error) {
        console.error('Error fetching video content:', error);
        console.error('Make sure VIDEO_SHEET_CSV_URL is set correctly');
        // Keep placeholder image on error
    }
}

// Build video content box
function buildVideoContentBox(videoUrl, displayVideo) {
    const videoBox = document.getElementById('videoContentBox');
    
    if (!videoUrl) {
        console.error('No video URL provided');
        return;
    }
    
    // Update the video box
    if (displayVideo) {
        videoBox.classList.add('video-enabled');
        videoBox.setAttribute('data-video-url', videoUrl);
    } else {
        videoBox.classList.remove('video-enabled');
        videoBox.removeAttribute('data-video-url');
    }
}

// Member Logo Carousel
let memberLogos = [];
let memberCurrentIndex = 0;
let memberAutoplayInterval;
const logosPerView = 5; // Desktop: show 5 logos at a time

async function fetchMemberLogos() {
    try {
        const proxyUrl = 'https://corsproxy.io/?';
        const url = proxyUrl + encodeURIComponent(MEMBER_LOGOS_CSV_URL);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch member logos');
        }
        
        const csvText = await response.text();
        console.log('Member logos CSV received:', csvText);
        
        const rows = csvText.split('\n').slice(1); // Skip header
        
        memberLogos = rows
            .filter(row => row.trim() !== '')
            .map(row => {
                const columns = parseCSVRow(row);
                return {
                    url: columns[0]?.trim() || '',
                    alt: columns[1]?.trim() || 'Member logo'
                };
            })
            .filter(logo => logo.url !== '');

        console.log('Parsed member logos:', memberLogos);

        if (memberLogos.length > 0) {
            buildMemberCarousel();
        }
    } catch (error) {
        console.error('Error fetching member logos:', error);
    }
}

function buildMemberCarousel() {
    const track = document.getElementById('memberCarouselTrack');
    
    // Create logo items HTML
    const logosHTML = memberLogos.map(logo => `
        <div class="member-logo-item">
            <img src="${logo.url}" alt="${logo.alt}" />
        </div>
    `).join('');
    
    track.innerHTML = logosHTML;
    
    // Add event listeners for controls
    document.getElementById('memberPrevBtn').addEventListener('click', () => {
        memberSlidePrev();
        resetMemberAutoplay();
    });
    
    document.getElementById('memberNextBtn').addEventListener('click', () => {
        memberSlideNext();
        resetMemberAutoplay();
    });
    
    // Start autoplay
    startMemberAutoplay();
    updateMemberCarousel();
}

function memberSlidePrev() {
    if (memberCurrentIndex > 0) {
        memberCurrentIndex--;
        updateMemberCarousel();
    }
}

function memberSlideNext() {
    const maxIndex = Math.max(0, memberLogos.length - logosPerView);
    if (memberCurrentIndex < maxIndex) {
        memberCurrentIndex++;
        updateMemberCarousel();
    } else {
        // Loop back to start
        memberCurrentIndex = 0;
        updateMemberCarousel();
    }
}

function updateMemberCarousel() {
    const track = document.getElementById('memberCarouselTrack');
    const itemWidth = track.children[0]?.offsetWidth || 0;
    const gap = 32; // 2rem gap
    const offset = memberCurrentIndex * (itemWidth + gap);
    
    track.style.transform = `translateX(-${offset}px)`;
    
    // Update button states
    const prevBtn = document.getElementById('memberPrevBtn');
    const nextBtn = document.getElementById('memberNextBtn');
    const maxIndex = Math.max(0, memberLogos.length - logosPerView);
    
    prevBtn.disabled = memberCurrentIndex === 0;
    nextBtn.disabled = false; // Never disable next since we loop
}

function startMemberAutoplay() {
    memberAutoplayInterval = setInterval(() => {
        memberSlideNext();
    }, 3000); // Slide every 3 seconds
}

function resetMemberAutoplay() {
    clearInterval(memberAutoplayInterval);
    startMemberAutoplay();
}

// Video Lightbox Functions
function openLightbox(videoUrl) {
    const lightbox = document.getElementById('videoLightbox');
    const videoFrame = document.getElementById('videoFrame');
    
    // Convert youtu.be URL to embed format
    // Extract video ID and parameters from URL like: https://youtu.be/dQw4w9WgXcQ?si=fM5LnBJS8FVdtU_c
    let videoId = '';
    let params = '';
    
    if (videoUrl.includes('youtu.be/')) {
        const parts = videoUrl.split('youtu.be/')[1].split('?');
        videoId = parts[0];
        params = parts[1] || '';
    } else if (videoUrl.includes('youtube.com/watch?v=')) {
        videoId = videoUrl.split('v=')[1].split('&')[0];
        // Extract other parameters
        const urlParams = videoUrl.split('?')[1];
        if (urlParams) {
            const paramArray = urlParams.split('&').filter(p => !p.startsWith('v='));
            params = paramArray.join('&');
        }
    }
    
    // Build embed URL with parameters
    let embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    if (params) {
        embedUrl += `&${params}`;
    }
    console.log('Opening video with embed URL:', embedUrl);
    
    videoFrame.src = embedUrl;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('videoLightbox');
    const videoFrame = document.getElementById('videoFrame');
    videoFrame.src = '';
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

// Add click event to video thumbnail
document.addEventListener('DOMContentLoaded', function() {
    const videoThumbnail = document.getElementById('videoContentBox');
    if (videoThumbnail) {
        videoThumbnail.addEventListener('click', function() {
            // Only open lightbox if video is enabled
            if (this.classList.contains('video-enabled')) {
                const videoUrl = this.getAttribute('data-video-url');
                if (videoUrl) {
                    openLightbox(videoUrl);
                }
            }
        });
    }

    // Close lightbox on background click
    document.getElementById('videoLightbox').addEventListener('click', function(e) {
        if (e.target === this) {
            closeLightbox();
        }
    });

    // Close lightbox on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
});
