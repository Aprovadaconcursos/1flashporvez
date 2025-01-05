let paragraphs = [];
let currentIndex = 0;
let isSpeaking = false;
let speechSynthesisUtterance = null;
let isPaused = false;

function handleFileUpload(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function(e) {
      mammoth.convertToHtml({ arrayBuffer: e.target.result })
        .then(function(result) {
          const htmlContent = result.value;

          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          const paragraphsArray = doc.body.querySelectorAll('p');

          paragraphs = Array.from(paragraphsArray).map(p => p.innerHTML);
          currentIndex = 0;
          showFlashcard(currentIndex);
        })
        .catch(function(err) {
          alert('Erro ao processar o arquivo Word.');
          console.log(err);
        });
    };

    reader.readAsArrayBuffer(file);
  }
}

function showFlashcard(index) {
  if (paragraphs.length > 0) {
    document.getElementById('flashcard-text').innerHTML = paragraphs[index];
    if (isSpeaking) {
      speakText(paragraphs[index]);
    }
  }
}

function removeHtmlTags(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.body.textContent || "";
}

function highlightWord(word) {
  const flashcardTextElement = document.getElementById('flashcard-text');
  const plainText = removeHtmlTags(paragraphs[currentIndex]);

  const words = plainText.split(' ');
  const highlightedHtml = words.map((w, index) => {
    return w === word ? `<span class='highlight'>${w}</span>` : w;
  }).join(' ');

  flashcardTextElement.innerHTML = highlightedHtml;
}

function speakText(text) {
  if (isSpeaking) {
    window.speechSynthesis.cancel();
  }

  const plainText = removeHtmlTags(text);
  const words = plainText.split(' ');

  const speech = new SpeechSynthesisUtterance(plainText);
  speech.rate = parseFloat(document.getElementById('speedSelect').value);
  speech.lang = "pt-BR";

  speech.onboundary = function(event) {
    const charIndex = event.charIndex;
    const spokenText = plainText.slice(0, charIndex);
    const spokenWords = spokenText.trim().split(' ');
    const currentWord = spokenWords[spokenWords.length - 1];

    highlightWord(currentWord);
  };

  window.speechSynthesis.speak(speech);

  speechSynthesisUtterance = speech;
  isSpeaking = true;
  isPaused = false;

  speech.onend = function () {
    isSpeaking = false;
  };
}

function pauseSpeech() {
  if (speechSynthesisUtterance) {
    window.speechSynthesis.pause();
    isSpeaking = false;
    isPaused = true;
  }
}

function resumeSpeech() {
  if (speechSynthesisUtterance && isPaused) {
    window.speechSynthesis.resume();
    isSpeaking = true;
    isPaused = false;
  }
}

function navigate(direction) {
  if (direction === "next" && currentIndex < paragraphs.length - 1) {
    currentIndex++;
    showFlashcard(currentIndex);
  } else if (direction === "previous" && currentIndex > 0) {
    currentIndex--;
    showFlashcard(currentIndex);
  }
}

function addFlashcard() {
  const newFlashcardText = "";
  paragraphs.splice(currentIndex + 1, 0, newFlashcardText);
  currentIndex++;
  showFlashcard(currentIndex);
}

function deleteFlashcard() {
  if (paragraphs.length > 0) {
    paragraphs.splice(currentIndex, 1);
    if (currentIndex >= paragraphs.length) {
      currentIndex = paragraphs.length - 1;
    }
    showFlashcard(currentIndex);
  }
}

function baixarFlashcards() {
  let docContent = "<html><head><style>body { font-family: Arial, sans-serif; font-size: 14px; }</style></head><body>";
  
  paragraphs.forEach((flashcard, index) => {
    docContent += `<h3>Flashcard ${index + 1}</h3><p>${flashcard}</p>`;
  });

  docContent += "</body></html>";

  const docx = htmlDocx.asBlob(docContent);

  saveAs(docx, "flashcards.docx");
}

document.getElementById('previousButton').addEventListener('click', () => navigate("previous"));
document.getElementById('nextButton').addEventListener('click', () => navigate("next"));

document.getElementById('addFlashcardButton').addEventListener('click', addFlashcard);
document.getElementById('deleteFlashcardButton').addEventListener('click', deleteFlashcard);

document.getElementById('speakButton').addEventListener('click', () => {
  if (!isSpeaking) {
    const currentText = paragraphs[currentIndex] || '';
    speakText(currentText);
  } else if (isPaused) {
    resumeSpeech();
  }
});

document.getElementById('pauseButton').addEventListener('click', () => {
  if (isSpeaking && !isPaused) {
    pauseSpeech();
  }
});

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('downloadButton').addEventListener('click', baixarFlashcards);
