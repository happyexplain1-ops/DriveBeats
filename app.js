
const API_KEY = "AIzaSyBrCnBFK8l6a_SwOx95e1oGHoyPVyce0gk";
const FOLDER_ID = "13_GYBfUCgQrJce5dqon4f3LcMtyWh6XZ";

let songs = [];
let current = -1;

const audio = document.getElementById("audio");

async function loadSongs(){

    const query = encodeURIComponent(
        `'${FOLDER_ID}' in parents and mimeType contains 'audio/' and trashed=false`
    );

    const url =
        `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,thumbnailLink)&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    songs = data.files || [];

    renderSongs(songs);
}

function renderSongs(list){

    const container = document.getElementById("songs");

    container.innerHTML = "";

    list.forEach((song,index)=>{

        const card = document.createElement("div");

        card.className = "song";

        card.innerHTML = `
            <img src="${song.thumbnailLink || 'https://via.placeholder.com/300'}">
            <h4>${song.name}</h4>
            <p>Google Drive</p>
        `;

        card.onclick = ()=>playSong(index);

        container.appendChild(card);
    });
}

function playSong(index){

    current = index;

    const song = songs[index];

    audio.src =
      `https://www.googleapis.com/drive/v3/files/${song.id}?alt=media&key=${API_KEY}`;

    audio.play();

    document.getElementById("title").textContent =
        song.name;

    document.getElementById("artist").textContent =
        "Google Drive";

    document.getElementById("cover").src =
        song.thumbnailLink || "";
}

function togglePlay(){

    if(audio.paused)
        audio.play();
    else
        audio.pause();
}

function nextSong(){

    if(current < songs.length-1)
        playSong(current+1);
}

function prevSong(){

    if(current > 0)
        playSong(current-1);
}

document
.getElementById("search")
.addEventListener("input",e=>{

    const q = e.target.value.toLowerCase();

    renderSongs(
        songs.filter(song =>
            song.name.toLowerCase().includes(q)
        )
    );
});

document
.getElementById("menuBtn")
.addEventListener("click",()=>{

    document
    .getElementById("sidebar")
    .classList.toggle("show");
});

loadSongs();
