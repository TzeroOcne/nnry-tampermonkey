// ==UserScript==
// @name         Copy Reader Area with Markdown Images for Reaper Scans
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Reformats img tags into Markdown format, removes p and br tags, and copies the innerHTML of #readerarea when button is clicked on reaper-scans.com
// @author       You
// @match        *://reaper-scans.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

// Function to clean up HTML and convert img tags to Markdown format
function cleanAndConvertToMarkdown(container) {
  let htmlContent = container.innerHTML; // Use innerHTML for content

  // Remove <p> and <br> tags
  htmlContent = htmlContent.replace(/<\/?p>/g, ''); // Remove <p> and </p>
  htmlContent = htmlContent.replace(/<br\s*\/?>/g, ''); // Remove <br> tags

  // Regular expression to find img tags
  const imgTagRegex = /<img [^>]*src="([^"]+)"[^>]*>/g;
  let match;

  // Process each img tag and convert it to Markdown format
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const imgSrc = match[1]; // Extract the image source URL
    const imgFileName = imgSrc.split('/').pop(); // Extract the image file name
    const markdownImage = `![${imgFileName}](${imgSrc})`;

    // Replace img tag with Markdown image
    htmlContent = htmlContent.replace(match[0], markdownImage);
  }

  return htmlContent;
}

// Function to clean up HTML and convert img tags to an array of objects
function cleanAndExtractImages(container) {
  let htmlContent = container.innerHTML; // Use innerHTML for content

  // Remove <p> and <br> tags
  htmlContent = htmlContent.replace(/<\/?p>/g, ''); // Remove <p> and </p>
  htmlContent = htmlContent.replace(/<br\s*\/?>/g, ''); // Remove <br> tags

  // Regular expression to find img tags
  const imgTagRegex = /<img [^>]*src="([^"]+)"[^>]*>/g;
  let match;

  // Array to hold the extracted image data
  const imageArray = [];

  // Process each img tag and extract title and source
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const imgSrc = match[1]; // Extract the image source URL
    const imgFileName = imgSrc.split('/').pop(); // Extract the image file name

    // Push the object with title and source to the array
    imageArray.push({
      name: imgFileName,
      source: imgSrc
    });
  }

  return imageArray;
}

// Function to extract manga title from the meta tag
function extractMangaTitle() {
  const metaTag = document.querySelector('meta[property="article:section"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  } else {
    alert('Manga title not found');
    return '';
  }
}

// Function to extract chapter title from the <h1> tag
function extractChapterTitle() {
  const h1Tag = document.querySelector('h1.entry-title[itemprop="name"]');
  if (h1Tag) {
    return h1Tag.textContent;
  } else {
    alert('Chapter title not found');
    return '';
  }
}

function createDownloadButton() {
  const downloadButton = document.createElement('button');
  downloadButton.innerText = 'Download';
  downloadButton.style.position = 'fixed';
  downloadButton.style.bottom = '120px'; // Set bottom to 120px
  downloadButton.style.right = '20px';
  downloadButton.style.padding = '10px';
  downloadButton.style.backgroundColor = '#007BFF';
  downloadButton.style.color = 'white';
  downloadButton.style.border = 'none';
  downloadButton.style.borderRadius = '5px';
  downloadButton.style.cursor = 'pointer';
  downloadButton.style.zIndex = '9999';

  return downloadButton;
}

const group = 'reaper-scans';

(function() {
  'use strict';

  // Create a button element
  const downloadButton = createDownloadButton();

  // Add click event to the button
  downloadButton.addEventListener('click', async () => {
    const readerArea = document.querySelector('#readerarea');
    if (readerArea) {
      const content = cleanAndExtractImages(readerArea);
      const title = extractMangaTitle();
      const chapter = extractChapterTitle();
      const data = {
        group,
        title,
        chapter,
        content,
      };

      await fetch(
        'http://127.0.0.1:7000',
        {
          method: 'post',
          body: JSON.stringify(data),
        },
      );
    } else {
      alert('Reader area not found');
    }
  });

  // Append button to the body
  document.body.appendChild(downloadButton);
})();

