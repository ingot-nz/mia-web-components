/* ============================================================================
   INGOT SCRIPTS - TABLE OF CONTENTS
   ============================================================================
   
   1. CONFIGURATION & GLOBAL VARIABLES
      - Google Sheet CSV URLs
      - Hero carousel variables
      - Member logo carousel variables
   
   2. HERO CAROUSEL
      - fetchImagesFromGoogleSheet() - Fetches hero carousel images from Google Sheet
      - parseCSVRow() - Parses CSV row handling quoted values
      - buildCarousel() - Builds hero carousel HTML structure
      - changeSlide() - Changes slide by direction (+1 or -1)
      - goToSlide() - Jumps to specific slide by index
      - startAutoplay() - Starts automatic slide rotation
      - resetAutoplay() - Resets autoplay timer
   
   3. VIDEO CONTENT BOX & LIGHTBOX
      - fetchVideoContentBox() - Fetches video data from Google Sheet
      - buildVideoContentBox() - Enables/disables video functionality
      - openLightbox() - Opens video in fullscreen lightbox
      - closeLightbox() - Closes video lightbox
   
   4. MEMBER LOGO CAROUSEL
      - fetchMemberLogos() - Fetches member logos from Google Sheet
      - buildMemberCarousel() - Builds member carousel HTML
      - memberSlidePrev() - Slides to previous logos
      - memberSlideNext() - Slides to next logos
      - updateMemberCarousel() - Updates carousel position
      - startMemberAutoplay() - Starts automatic logo rotation
      - resetMemberAutoplay() - Resets member carousel autoplay timer
   
   5. EVENT TABLE OF CONTENTS SCROLL SPY
      - initEventTocScrollSpy() - Initializes scroll-based TOC highlighting
      - updateEventTocActive() - Updates active TOC item based on scroll position
   
   6. INITIALIZATION
      - Element existence checks and function calls
      - DOMContentLoaded event listeners for video interactions
   
   ============================================================================ */

// ============================================================================
// 1. CONFIGURATION & GLOBAL VARIABLES
// ============================================================================

// Configuration: Replace with your Google Sheet published CSV URLs
// To get these URLs:
// 1. In Google Sheets, go to File > Share > Publish to web
// 2. Select the specific sheet tab (e.g., "Home Hero Carousel") and choose "Comma-separated values (.csv)"
// 3. Click Publish and copy the URL
// 4. Repeat for each sheet tab
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcFCl8wWVnh4CUBuZig_1xrDjl_oaLELxa3tZHqa4shBr6Ff9ffiKPhcjx5cBXdy3YYV_JkoHmIHnn/pub?output=csv';
const VIDEO_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcFCl8wWVnh4CUBuZig_1xrDjl_oaLELxa3tZHqa4shBr6Ff9ffiKPhcjx5cBXdy3YYV_JkoHmIHnn/pub?gid=2124855345&single=true&output=csv';
const MEMBER_LOGOS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcFCl8wWVnh4CUBuZig_1xrDjl_oaLELxa3tZHqa4shBr6Ff9ffiKPhcjx5cBXdy3YYV_JkoHmIHnn/pub?gid=1102148999&single=true&output=csv';

// Hero carousel variables
let currentSlide = 0;
let images = [];
let autoplayInterval;

// Member logo carousel variables
let memberLogos = [];
let memberCurrentIndex = 0;
let memberAutoplayInterval;

// ============================================================================
// 2. HERO CAROUSEL
// ============================================================================

/**
 * Fetches hero carousel images from Google Sheet and builds the carousel
 * Uses CORS proxy in development - remove for production
 */
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
            console.log('No images found in Google Sheet - keeping static placeholder');
            return; // Keep the static placeholder slide
        }

        buildCarousel();
    } catch (error) {
        console.error('Error fetching images:', error);
        console.error('Error details:', error.message);
        // Keep the static placeholder on error instead of showing error message
        console.log('Error loading carousel - keeping static placeholder');
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

/**
 * Builds the hero carousel HTML structure and sets up event listeners
 * Adds no-animation class to first slide to prevent flicker on load
 */
function buildCarousel() {
    const carousel = document.getElementById('hero-carousel');
    
    // If only one image and it matches the placeholder, don't rebuild
    if (images.length === 1 && images[0].url === 'https://cdn.ymaws.com/the-mia.site-ym.com/resource/resmgr/ingot/btcc_with_blur.jpg') {
        return;
    }
    
    // Create slides HTML - add no-animation class to first slide
    const slidesHTML = images.map((img, index) => `
        <div class="hero-carousel-slide ${index === 0 ? 'active no-animation' : ''}">
            <img src="${img.url}" alt="${img.alt}" />
        </div>
    `).join('');

    // Create indicators HTML
    const indicatorsHTML = images.map((_, index) => `
        <span class="hero-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
    `).join('');

    // Build carousel structure
    carousel.innerHTML = `
        ${slidesHTML}
        <div class="hero-carousel-indicators-wrapper">
            ${indicatorsHTML}
        </div>
    `;

    // Add event listeners for indicators
    document.querySelectorAll('.hero-indicator').forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            goToSlide(index);
            resetAutoplay();
        });
    });

    // Start autoplay with longer initial delay
    setTimeout(() => {
        startAutoplay();
    }, 1000); // Wait 1 second before starting autoplay
}

/**
 * Changes the active slide by the specified direction
 * @param {number} direction - Direction to move (+1 for next, -1 for previous)
 */
function changeSlide(direction) {
    const slides = document.querySelectorAll('.hero-carousel-slide');
    const indicators = document.querySelectorAll('.hero-indicator');

    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = (currentSlide + direction + images.length) % images.length;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

/**
 * Jumps directly to a specific slide by index
 * @param {number} index - Index of the slide to show
 */
function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-carousel-slide');
    const indicators = document.querySelectorAll('.hero-indicator');

    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = index;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

/**
 * Starts automatic slide rotation every 5 seconds
 */
function startAutoplay() {
    autoplayInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // Change slide every 5 seconds
}

/**
 * Resets the autoplay timer (used when user manually changes slides)
 */
function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
}

// ============================================================================
// 3. VIDEO CONTENT BOX & LIGHTBOX
// ============================================================================

/**
 * Fetches video content data from Google Sheet
 * Determines whether to enable video functionality based on sheet data
 */
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

/**
 * Enables or disables video functionality on the content box
 * @param {string} videoUrl - YouTube video URL
 * @param {boolean} displayVideo - Whether to enable video functionality
 */
function buildVideoContentBox(videoUrl, displayVideo) {
    const videoBox = document.getElementById('videoContentBox');
    
    if (!videoBox) {
        return;
    }
    
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

/**
 * Opens a YouTube video in a fullscreen lightbox overlay
 * Converts various YouTube URL formats to embed format
 * @param {string} videoUrl - YouTube video URL (supports youtu.be and youtube.com formats)
 */
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

/**
 * Closes the video lightbox and stops video playback
 */
function closeLightbox() {
    const lightbox = document.getElementById('videoLightbox');
    const videoFrame = document.getElementById('videoFrame');
    videoFrame.src = '';
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Set up video lightbox event listeners
 * - Click on video thumbnail to open lightbox
 * - Click outside lightbox to close
 * - Press Escape key to close
 */
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
    const videoLightbox = document.getElementById('videoLightbox');
    if (videoLightbox) {
        videoLightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
    }

    // Close lightbox on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoLightbox && videoLightbox.classList.contains('active')) {
            closeLightbox();
        }
    });
});

// ============================================================================
// 4. MEMBER LOGO CAROUSEL
// ============================================================================

/**
 * Fetches member logos from Google Sheet and builds the carousel
 */
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

/**
 * Builds the member logo carousel HTML and sets up controls
 */
function buildMemberCarousel() {
    const track = document.getElementById('memberCarouselTrack');
    const prevBtn = document.getElementById('memberPrevBtn');
    const nextBtn = document.getElementById('memberNextBtn');
    
    if (!track || !prevBtn || !nextBtn) {
        return;
    }
    
    // Create logo items HTML
    const logosHTML = memberLogos.map(logo => `
        <div class="member-logo-item">
            <img src="${logo.url}" alt="${logo.alt}" />
        </div>
    `).join('');
    
    track.innerHTML = logosHTML;
    
    // Add event listeners for controls
    prevBtn.addEventListener('click', () => {
        memberSlidePrev();
        resetMemberAutoplay();
    });
    
    nextBtn.addEventListener('click', () => {
        memberSlideNext();
        resetMemberAutoplay();
    });
    
    // Start autoplay
    startMemberAutoplay();
    updateMemberCarousel();
}

/**
 * Slides the member carousel to the previous set of logos
 */
function memberSlidePrev() {
    if (memberCurrentIndex > 0) {
        memberCurrentIndex--;
        updateMemberCarousel();
    }
}

/**
 * Gets the number of logos visible based on screen width
 * @returns {number} Number of logos per view
 */
function getLogosPerView() {
    const width = window.innerWidth;
    if (width <= 768) {
        return 2; // Mobile: 2 logos
    } else if (width <= 1200) {
        return 4; // Tablet: 4 logos
    } else {
        return 5; // Desktop: 5 logos
    }
}

/**
 * Slides the member carousel to the next set of logos
 * Loops back to start when reaching the end
 */
function memberSlideNext() {
    const logosPerView = getLogosPerView();
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

/**
 * Updates the member carousel position and button states
 */
function updateMemberCarousel() {
    const track = document.getElementById('memberCarouselTrack');
    const itemWidth = track.children[0]?.offsetWidth || 0;
    const gap = 32; // 2rem gap
    const offset = memberCurrentIndex * (itemWidth + gap);
    
    track.style.transform = `translateX(-${offset}px)`;
    
    // Update button states
    const prevBtn = document.getElementById('memberPrevBtn');
    const nextBtn = document.getElementById('memberNextBtn');
    const logosPerView = getLogosPerView();
    const maxIndex = Math.max(0, memberLogos.length - logosPerView);
    
    prevBtn.disabled = memberCurrentIndex === 0;
    nextBtn.disabled = false; // Never disable next since we loop
}

/**
 * Starts automatic member logo carousel rotation every 3 seconds
 */
function startMemberAutoplay() {
    memberAutoplayInterval = setInterval(() => {
        memberSlideNext();
    }, 3000); // Slide every 3 seconds
}

/**
 * Resets the member carousel autoplay timer
 */
function resetMemberAutoplay() {
    clearInterval(memberAutoplayInterval);
    startMemberAutoplay();
}

// ============================================================================
// 5. EVENT TABLE OF CONTENTS SCROLL SPY
// ============================================================================

/**
 * Initializes scroll-based table of contents highlighting
 * Highlights the TOC link corresponding to the currently visible section
 */
function initEventTocScrollSpy() {
    const tocLinks = document.querySelectorAll('.event-toc a');
    const sections = document.querySelectorAll('.event-content[id^="section-"]');
    
    if (tocLinks.length === 0 || sections.length === 0) return;
    
    /**
     * Updates the active state of TOC links based on scroll position
     */
    function updateEventTocActive() {
        const scrollPosition = window.scrollY + 200; // Offset for sticky header
        
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        tocLinks.forEach(link => {
            const linkHref = link.getAttribute('href').substring(1); // Remove # from href
            const parentLi = link.parentElement;
            
            if (linkHref === currentSection) {
                parentLi.classList.add('active');
            } else {
                parentLi.classList.remove('active');
            }
        });
    }
    
    // Initial check
    updateEventTocActive();
    
    // Update on scroll with throttling for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(() => {
            updateEventTocActive();
        });
    });
}

// ============================================================================
// 6. INITIALIZATION
// ============================================================================

/**
 * Initialize all components when DOM is ready
 * Checks for element existence before initializing each component
 */

// Initialize carousels and video content box when page loads
if (document.getElementById('hero-carousel')) {
    fetchImagesFromGoogleSheet();
}
if (document.getElementById('videoContentBox')) {
    fetchVideoContentBox();
}
if (document.getElementById('memberCarouselTrack')) {
    fetchMemberLogos();
    
    // Handle window resize for responsive carousel
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Reset to first slide if current index is out of bounds
            const logosPerView = getLogosPerView();
            const maxIndex = Math.max(0, memberLogos.length - logosPerView);
            if (memberCurrentIndex > maxIndex) {
                memberCurrentIndex = maxIndex;
            }
            updateMemberCarousel();
        }, 250); // Debounce resize events
    });
}
if (document.querySelector('.event-toc')) {
    initEventTocScrollSpy();
}


