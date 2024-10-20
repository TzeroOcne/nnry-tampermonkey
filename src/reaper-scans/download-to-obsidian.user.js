// ==UserScript==
// @name         Reaper Scans Chapter Downloader
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Reformats img tags into Markdown format, removes p and br tags, and copies the innerHTML of #readerarea when button is clicked on reaper-scans.com
// @author       You
// @match        *://reaper-scans.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

/**
 * Tampermonkey script for download chapter
 * from reaper-scans.com to obsidian app
 *
 * This script require obsidian-manga-reader
 * plugin installed in obsidian
 */

// Function to clean up HTML and convert img tags to Markdown format
/**
 * @param {HTMLElement} container 
 * */
function cleanAndConvertToMarkdown(container) {
  let htmlContent = container.innerHTML; // Use innerHTML for content

  // Remove <p> and <br> tags
  htmlContent = htmlContent.replace(/<\/?p>/g, ''); // Remove <p> and </p>
  htmlContent = htmlContent.replace(/<br\s*\/?>/g, ''); // Remove <br> tags

  // Regular expression to find img tags
  const imgTagRegex = /<img [^>]*src="([^"]+)"[^>]*>/g;
  /** @type {RegExpExecArray | null} */
  let match;

  // Process each img tag and convert it to Markdown format
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const imgSrc = match[1]; // Extract the image source URL
    /** @type {string} */
    const imgFileName = imgSrc.split('/').pop(); // Extract the image file name
    const markdownImage = `![${imgFileName}](${imgSrc})`;

    // Replace img tag with Markdown image
    htmlContent = htmlContent.replace(match[0], markdownImage);
  }

  return htmlContent;
}

// Function to clean up HTML and convert img tags to an array of objects
/**
 * @param {HTMLElement} container 
 * */
function cleanAndExtractImages(container) {
  let htmlContent = container.innerHTML; // Use innerHTML for content

  // Remove <p> and <br> tags
  htmlContent = htmlContent.replace(/<\/?p>/g, ''); // Remove <p> and </p>
  htmlContent = htmlContent.replace(/<br\s*\/?>/g, ''); // Remove <br> tags

  // Regular expression to find img tags
  const imgTagRegex = /<img [^>]*src="([^"]+)"[^>]*>/g;
  /** @type {RegExpExecArray | null} */
  let match;

  // Array to hold the extracted image data
  const imageArray = [];

  // Process each img tag and extract title and source
  while ((match = imgTagRegex.exec(htmlContent)) !== null) {
    const imgSrc = match[1]; // Extract the image source URL
    /** @type {string} */
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
  const mangaTitleElement = document.querySelector('meta[property="article:section"]');
  if (!mangaTitleElement) {
    alert('Manga title not found');
    throw new Error('Manga title not found');
  }

  const mangaTitle = mangaTitleElement.getAttribute('content');
  if (!mangaTitle) {
    alert('Manga title empty');
    throw new Error('Manga title empty');
  }

  return mangaTitle;
}

// Function to extract chapter title from the <h1> tag
function extractChapterTitle() {
  const chapterTitleElement = document.querySelector('h1.entry-title[itemprop="name"]');
  if (!chapterTitleElement) {
    alert('Chapter title not found');
    throw new Error('Chapter title not found');
  }

  if (!chapterTitleElement.textContent) {
    alert('Chapter title empty');
    throw new Error('Chapter title empty');
  }

  return chapterTitleElement.textContent;
}

function extractChapterLink() {
  return location.pathname.replace(/^\/+|\/+$/g, '');
}

/**
 * @param {string} selector 
 * */
function extractAnchorLink(selector) {
  /** @type {HTMLAnchorElement|null} */
  const anchorChapterButton = document.querySelector(selector);
  if (!anchorChapterButton) {
    alert('Anchor button not found');
    throw new Error('Next chapter button not found');
  }

  return (new URL(anchorChapterButton.href)).pathname.replace(/^\/+|\/+$/g, '');
}

function extractPrevChapterLink() {
  return extractAnchorLink('a.ch-prev-btn');
}

function extractNextChapterLink() {
  return extractAnchorLink('a.ch-next-btn');
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

function main() {
  // Create a button element
  const downloadButton = createDownloadButton();

  // Add click event to the button
  downloadButton.addEventListener('click', async () => {
    const readerArea = document.querySelector('#readerarea');
    if (readerArea) {
      const content = cleanAndExtractImages(readerArea);
      const title = extractMangaTitle();
      const chapter = extractChapterTitle();
      const chapterLink = extractChapterLink();
      const prevChapterLink = extractPrevChapterLink();
      const nextChapterLink = extractNextChapterLink();
      const data = {
        group,
        title,
        chapter,
        content,
        chapterLink,
        prevChapterLink,
        nextChapterLink,
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
}

(function() {
  'use strict';

  window.addEventListener('load', main);
  (new MutationObserver((mutationList) => {
    mutationList.forEach((mutation) => {
      switch (mutation.type) {
        case "attributes":
          switch (mutation.attributeName) {
            case "href":
              main();
              break;
          }
          break;
      }
    });
  })).observe('a.ch-next-btn', { attributes: true });
})();
 
