// The book data
var KronoriumSource = '';
var CurrentLanguage = 'en';
var CurrentLanguageIndex = 0; // Index 0 should always be English

var UseExtendedPage = false;

// TODO: Images
// TODO: Language selector
// TODO: Error popups

// RULES:
// Make sure pages don't overflow! Use images if necessary to fill gaps.
// TRIPLE CHECK THAT YOU DIDN'T MISS AN ENTRY!!
// Recommended for data editing: http://www.jsoneditoronline.org/

// Load sounds (Open / close / flip)
var OpenSound = null;
var CloseSound = null;
var FlipSound = null;

var validLanguages = [ // Add languages here
    //code  fullname  percentage  requireLarger
    ['en', 'English', 100, false],
    ['pl', 'Polski', 3, true]
];

function isLanguageValid(lang) {
    return (lang < validLanguages.length && lang >= 0 ? true : false);
}

function addLanguage(item, index) {
    var result = '<a href="?lang=' + index.toString() + '">'; // + item[0] + '&useExtendedPage=' + item[3].toString() + '">' + item[1];

    if (item[2] < 100)
        result += ' (' + item[2] + '%)';

    result += '</a><br/>';

    $("#language-menu").append(result);
}

$(document).ready(function() {
    // Add valid languages to language menu
    $("#language-menu").html(""); // clear that first
    validLanguages.forEach(addLanguage);

    // Set language based on URL, default is English
    CurrentLanguageIndex = parseInt(getParameterByName("lang"));

    // Check if language is in valid languages array
    if (!isLanguageValid(CurrentLanguageIndex)) {
        CurrentLanguageIndex = 0;
    }

    CurrentLanguage = validLanguages[CurrentLanguageIndex][0];
    UseExtendedPage = validLanguages[CurrentLanguageIndex][3];

    // We must load the specific JSON source for our language
    $.get(('data/' + CurrentLanguage + '/story.json'), BeginLoad).fail(DisplayFail);
});

function DisplayFail() {
    // TODO: Display an error that we couldn't load the defs
    $("#kronorium").html("Errors happened while initializing.");
}

function SetupArrowKeys() {
    // Hook left / right keys for easy navigation
    $(document).keydown(function(e) {
        // Check key
        switch (e.which) {
            case 37: // left / go back
                $("#kronorium").turn("previous");
                break;
            case 39: // right / go forward
                $("#kronorium").turn("next");
                break;
            default:
                return; // cancel for other keys
        }
        // Stop default action
        e.preventDefault();
    });
}

function BeginLoad(data) {
    // Set it
    if (typeof data === 'string') {
        KronoriumSource = JSON.parse(data);
    } else {
        KronoriumSource = data;
    }
    // Setup page
    SetupPage();
    // Wait 1s to start
    setTimeout(BeginPage, 1000);
    // Hook keys
    SetupArrowKeys();
}

function BeginPage() {
    // Load sounds / begin
    OpenSound = new Howl({
        src: ['sound/open.mp3', 'sound/open.wav', 'sound/open.ogg'],
        onload: function() { SetupInitialAnim(); },
        volume: 0.5
    });
    CloseSound = new Howl({
        src: ['sound/close.mp3', 'sound/close.wav', 'sound/close.ogg'],
        volume: 0.5
    });
    FlipSound = new Howl({
        src: ['sound/flip.mp3', 'sound/flip.wav', 'sound/flip.ogg'],
        volume: 0.5
    });
}

function JumpPage(page) {
    // Go to it
    $("#kronorium").turn('page', page);
}

function BeginLoadCreditsIndex() {
    // Load inside of credit / index in async
    $.get(('data/' + CurrentLanguage + '/credits.html'), function(data) {
        // Inject data to credits
        $('#credits-inject').append($(data));
    }).fail(DisplayFail);
    $.get(('data/' + CurrentLanguage + '/index.html'), function(data) {
        // Inject data to index
        $('#index-inject').append($(data));
    }).fail(DisplayFail);
}

function SetupPage() {
    // Inject pages based on the template
    $('#kronorium').append('<div class="hard" style="background-image:url(images/binding_front.png)"></div>');
    // Actual binding
    $('#kronorium').append('<div class="hard" style="background-image:url(images/binding_first.png)"></div>');
    // Append placeholders
    $('#kronorium').append($('#credits-inject'));
    $('#kronorium').append($('#index-inject'));
    // Unhide them
    $('#credits-inject').removeClass('hide');
    $('#index-inject').removeClass('hide');
    // Credits / Index
    BeginLoadCreditsIndex();
    // Current page type (right, then left) (0, 1)
    var PageType = 0;
    var PageCount = 0;
    // Loop through book data
    for (var page in KronoriumSource) {
        var BuiltSource = '';
        // Determine page side
        if (PageType == 0) {
            BuiltSource += '<div style="background-image:url(images/page_right.png)"><div class="kron-base-right">';
            PageType = 1;
        } else {
            BuiltSource += '<div style="background-image:url(images/page_left.png)"><div class="kron-base-left">';
            PageType = 0;
        }
        // Build events
        for (var i = 0; i < KronoriumSource[page].length; i++) {
            // Check if it's an image
            if (KronoriumSource[page][i].hasOwnProperty('img')) {
                // Embed an image here
                BuiltSource += KronoriumSource[page][i]['img'];
            } else {
                // Normal source
                BuiltSource += '<h3 class="date-head">' + KronoriumSource[page][i]['date'] + '</h3>';
                BuiltSource += '<p class="event-text">' + KronoriumSource[page][i]['event'] + '</p>';
                BuiltSource += '<div class="event-space"></div>';
            }
        }
        PageCount++;
        // Add it
        $('#kronorium').append(BuiltSource + '</div></div>');
    }
    // Check to add a blank page
    if (PageCount % 2 != 0) {
        // Add blank
        $('#kronorium').append('<div style="background-image:url(images/page_left.png)"></div>');
    }
    // Backing
    $('#kronorium').append('<div class="hard" style="background-image:url(images/binding_end.png)"></div>');
    // Initialize the book
    if (UseExtendedPage) {
        $("#viewport").attr("class", "flipbook-viewport-extended");
        $("#kronorium").turn({
            width: 998,
            height: 650,
            elevation: 50,
            gradients: false,
            autoCenter: true
        });
    } else {
        $("#viewport").attr("class", "flipbook-viewport");
        $("#kronorium").turn({
            width: 922,
            height: 600,
            elevation: 50,
            gradients: false,
            autoCenter: true
        });
    }
    // Disable it for the opening effect
    $("#kronorium").turn("disable", true);
}

function SetupInitialAnim() {
    // Add the shake effect, play sound, then countdown to open
    $('#kronorium').addClass('shake shake-constant');
    // Play
    OpenSound.play();
    // Time
    setTimeout(EnableBookOpen, 1600);
}

function EnableBookOpen() {
    // Enable the book, open to first page, stop shake
    $('#kronorium').removeClass('shake shake-constant');
    // Enable
    $("#kronorium").turn("disable", false);
    // Turn
    $("#kronorium").turn("page", 2);
    // Hook page turning
    $("#kronorium").bind("turning", function(event, page, view) {
        // If we turned, we can play it (Unless to closed, (figure out a better closed sound))
        if (page > 2) { FlipSound.play(); }
    });
}

// Thanks stack overflow!
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}