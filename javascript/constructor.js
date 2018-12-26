/*
  To Do:
    . [high-priority] clean up code
    . [high-priority] change level design to reflect new movement stats && improve
        how players learn. Level 2 intro text === bad. First level mario or megaman === great
    . [high-priority] Make game flex-friendly so it can resize based on screen height & width
      . [high-priority] Change some sprites so they are not scale-dependent for grabbing image
        . Main Character, coins, horizontal lava, vertical lava, and the paladin?

    . improve what happens when you die
      - change status div children's displays to none
      - change status div text to "Victory or You Died"
    . [mid-priority] Add Leaderboard
    . [mid-priority] Edit designs to force players to trust me
      i. create fall points early on where the player can't see what they're jumping into
      ii. consistently have safe landings designed for players.
      iii. or if there's a really hard jump, have a 'catch' point below it so players don't fall too far.
      iv. just use repetition to foster trust and use that to enable players to be risky and try for harder tasks,
          like clearing the game of all coins or achieving Paladin status.
    . [low priority] Change music so it's just a playlist (?)
    . [high-priority][
        Do more to make the game enjoyable. Right now its mostly just challenging
        Animate Lava Sprite,
        Get better sprites,
      ]
    . Put Secret blocks in. First level above Naked Guy
    .  [low-priority] Allow for text input style answers
    . Build algorithm to check for playability
    . Allow nested discussions to happen in interactions?
    ...
*/

/*
NOTES:
  . I recently removed a 3rd arg (gameEvents) from runAnimation()
    . If some event-related thing breaks, this may be a cause
*/


/*
GLOBAL VARIABLES
line 38
  Only used to store game related events that persist after the game
  Note: 'levels.js' contains globals: TRACKS, CHAPTER_TITLES, GAME_EVENTS, and GAME_LEVELS   */

// Used to store gameplay stats on death so we can pass them back into the
// game if the player continues
let CONTINUEGAMESTATS = {
  continuesUsed: 0,
  lastCoins: [],
  lastTime: new Date,
  lastLevel: 0,
  lastAnswers: 0,
};

const email = "";// mail+recipient+at+dotcom

// GLOBAL FUNCTIONS (INVOKED BY DOM ELEMENTS)
// lines 49 - 90

// Handle score submission (stringify && encode score && send to my dev email)
function onSubmit() {
  const score = {
    coins: document.getElementById("coins").innerHTML,
    correctAnswers: document.getElementById("correctAnswers").innerHTML,
    lives: document.getElementById("hasContinued").innerHTML,
    time: document.getElementById("time").innerHTML,
  };
  const body = JSON.stringify(score);
  const encodedBody = btoa(body);
  const topic = "scoreSubmission";
  const recipient = "thelastpaladin.developer";
  const at = String.fromCharCode(64);
  const dotcom = "gmail.com";
  const mail = "mailto:";
  // NOTES: if you don't have to change values, consider making them global/persistent
  // so they don't have to be instantiated each time function is called
  const beginning = ``;
  window.open(email + '?subject=' + topic + '&body=' + encodedBody + '\n Type your name and click send! When the leader page is up I will send you an email');
}

// NOTES
// function setManyDisplay(ids, values) {
//   for id in ids {
//     setDisplay()
//   }
// }

// function setStyle(id, value="none", styleAttr = "display") {
//   document.getElementById(id).style[styleAttr] = value;
// }

// Displays Score but not submit to email button
function viewScoreLose() {
  // setDisplay("endGame1");
  document.getElementById("endGame1").style.display = "none";
  document.getElementById("continueGame").style.display = "none";
  document.getElementById("endGame2").style.display = "flex";
  document.getElementById("submitToEmail").style.display = "none";
}

// Displays Score and submit to email button
function viewScoreWin() {
  document.getElementById("endGame1").style.display = "none";
  document.getElementById("continueGame").style.display = "none";
  document.getElementById("endGame2").style.display = "flex";
  document.getElementById("submitToEmail").style.display = "block";
}

// When 'Continue' is pressed in DOM, call onStart function
// and pass it the stats necessary to persist previous player state
function continueGame() {
  console.log("calling continue game. continueArgs: ", CONTINUEGAMESTATS);
  onStart(CONTINUEGAMESTATS);
}

// Main Game Function
function onStart(preDeathScore) {

  // Clear all non-game elements and display game elements
  document.getElementById("startButton").style.display = "none";
  document.getElementById("endGame1").style.display = "none";
  document.getElementById("endGame2").style.display = "none";
  document.getElementById("continueGame").style.display = "none";
  document.getElementById("gameBox").style.display = "none";
  document.getElementById("status").style.display = "none";
  document.getElementById("gameBottom").style.display = "none";
  document.getElementById("game").style.display = "flex";
  document.getElementById("gameBox").style.display = "flex";
  document.getElementById("status").style.display = "flex";
  document.getElementById("gameBottom").style.display = "block";

  // create a variable reference for DOM audio elements
  const audio = document.getElementById("music");
  const soundFX = document.getElementById("soundFX");

  // initialize scale
    // Used to size the canvas and actors (also some sprite positions (BAD - Should change))
    // TODO - figure out how to make scale dynamic so I can make game window & element sizes responsive
  const scale = 20;
  // NOTE
  // constant, commonly used strings can be initialized once and used by reference.
  // Basically, instead of creating a new string object each time, just use the address to
  // reference the same object. Saves processing time and memory
  const kDown = "keydown";
  const kUp = "keyup";

  // Important function - used to determine all overlap
  function overlap(actor1, actor2) {
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&
           actor1.pos.x < actor2.pos.x + actor2.size.x &&
           actor1.pos.y + actor1.size.y > actor2.pos.y &&
           actor1.pos.y < actor2.pos.y + actor2.size.y;
  }

  // helper func that tracks player movement using eventListeners
  function trackMovement(keys) {
    // create an empty down object
    const down = Object.create(null);

    // Define track function
    function track(event) { // NOTE: write a factory function to create slightly different track functions
      if (keys.includes(event.key)) {
        down[event.key] = event.type == kDown;
        event.preventDefault();
      }
    }
    /* listen for keyUp and keyDown.
      on event, call second param (track), which gets passed event by default
      https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener  */
    window.addEventListener(kDown, track);
    window.addEventListener(kUp, track);
    // return the down object, which should contain a prop for each key w/ a boolean value
    // console.log("trackMovement down: ", down);
    return down;
  }

  // helper func that tracks response to paladin using eventListener
  //  main diff. from trackMovement() is it tracks the press, not the up/down state
  // also inits down to empty obj, not null, which would throw errors in state.update
  function trackAnswers(keys) {
    let down = {};
    function track(event) {
      if (keys.includes(event.key)) {
        down[event.key] = event.type == "keypress";
        // NOTE: same for keypress as keyup and keydown
        event.preventDefault();
      }
    }
    window.addEventListener("keypress", track);
    return down;
  }

  // helper func that pauses the game using eventListener
  function trackPause(keys) {
    let down = {paused: false};
    function track(event) {
      if (keys.includes(event.key)) {
        if (down[event.key]) {down[event.key] = false}
        else {
          down[event.key] = event.type === "keypress";
          event.preventDefault();
        }
      }
    }
    window.addEventListener("keypress", track);
    return down;
  }

  // calls trackMovement w/ arrowKeys as args
  const arrowKeys = trackMovement([
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ]);
  // calls trackAnswers w/ numKeys as args
  const numKeys = trackAnswers([
    "1",
    "2",
    "3",
    "4",
  ]);
  // calls trackPause w/ 'p' as arg
  const pauseKey = trackPause([
    "p",
  ]);


  // 1st of the 'big 3' (others: runLevel, runGame)
  // Called by runLevel(), 1st arg is self-explanatory
  // 2nd arg is a function from runLevel & contains most of the logic runAnimation uses
  // Ultimately, this just creates timeSteps and keeps calling renderNextFrame until the user
  // state is no longer === playing. It then returns.
  function runAnimation(state, renderNextFrame) {

    // lastTime allows us to track timeSteps
    let lastTime = null;

    // paused allows us to skip invoking renderNextFrame while true
    let paused = false;

    // This is the func that is passed to requestAnimation frame
    function frame(time) {
      // if pauseKey.p, pause the game
      paused = pauseKey.p;
      // if not paused, run the loop. Otherwise keep looping to check pause state
      if (!paused) {
        if (lastTime !== null) {
          const timeStep = Math.min(time - lastTime, 100) / 1000;
          // frame func is defined ~ 288
          if (renderNextFrame(timeStep) === false) return;
        }
        lastTime = time;
      }
      // recursively calls above func until it returns
      requestAnimationFrame(frame);
    }
    // inits animation --v
    // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
    requestAnimationFrame(frame);
  }


  // 2nd of the big 3 functions (others: runAnimation, runGame)
  // called by run game, run level returns a promise that resolves
  // with an object that has a score, status, and loadPoint property
  function runLevel(level, Display, events, song, coinsLevel) {

    // if audio isn't paused, update song to match the level
    if (!audio.paused) {
      // all this slicing just allows us to grab the song correctly
      const subSrc = audio.src.substr(audio.src.indexOf("audio/"));
      //console.log("subSrc: ", subSrc, "song.slice(2): ", song.slice(2));
      if (subSrc !== song.slice(2)) {
        audio.src = song;
      }
    }

    // ~255-278: if there are coins passed in, remove them from the game
    if (coinsLevel) {
    // console.log("1. you have coins.");
      const filteredArr = [];
      // NOTE: const filteredArr = level.startActors.filter(newFunc);
      // Rather than instantiating empty array and filling it seperately,
      // just use filter method to return filteredArr

      // for (let i = 0; i < level.startActors.length; i++) {
      for (actor of level.startActors) {
        console.log(actor);
        // const currActor = actor;
        if (actor.type === "coin") {
          let found = false;
          // console.log("startActor[i].type is coin: ", actor);
          for (coin of coinsLevel) {
            // console.log("coin: ", coin);
            const c = coin.basePos, a = actor.basePos;
            if ((c.x === a.x) && (c.y === a.y)) {
              // console.log("found a already-gotten coin!");
              found = true;
              break;
            }
          }
          if (!found) {
            filteredArr.push(actor);
          }
        } else {
          filteredArr.push(actor);
        }
      }
      level.startActors = filteredArr;
      //console.log("level.startActors: ", level.startActors, "filteredArr final: ", filteredArr);
    }

    // I was having some issues with the EVENTS global object getting manipulated and causing issues
    // So I probably went overboard here. To Be Fixed at a later date
      // but be cautious and log events every runLevel cycle
    const EVENTS = Object.freeze(events);
    // const gameEvents = EVENTS;
    // console.log("invoking runLevel func w/ following args: ", level, Display, gameEvents);

    // builds display
    let display = new Display(document.getElementById("gameBox"), level);

    // initializes state with proper args
    let state = State.start(level, undefined, "playing", EVENTS, {}, 0, {}, false, {});

    // ending is a timer so we can have 1 second between death and restarting gameplay
    let ending = 1;

    // This is the meat of runLevel(), calls runAnimation and passes it 2 args
    // state, and a func (frame func)
    // Resolves with an object that contains score, status, and possibly a load point
    return new Promise(resolve => {
      runAnimation(state, (time) => {
        // console.log("running frame func ~302: state: ", state);

        // v-- Next two lines are the most important. They update the state and the display
        state = state.update(time, arrowKeys, EVENTS, numKeys);
        display.syncState(state);

        // If we're still playing, return true (i.e. execute animation & update loop again)
        if (state.status == "playing") {
          return true;
        }
        // Otherwise, wait for ~one second
        else if (ending > 0) {
          ending -= time;
          return true;
        }
        // then clear the display, resolve the promise, and return false.
        else {
          display.clear();
          // console.log("{RESOLVING GAME} score: ", state.score, "status: ", state.status, "loadPoint: ", state.loadPoint);
          resolve({score: state.score, status: state.status, loadPoint: state.loadPoint});
          return false;
        }
      });
    });
  }



  // 3rd of the big 3 functions. runGame gets called at the end of onStart
  // it then calls runLevel, which calls runAnimation
  async function runGame(plans, events, titles, music, Display, continueArgs) {
    /*
      INITIALIZE VARIABLES NECESSARY FOR THE GAME
    */
    // toggle to true if continue happens
    let level;

    // initialize to new time or carry over from before continue
    let startTime;
    let endTime;
    let lives = 5;
    let CUMSCORE = {};
    let loadVec = {};
    let coins = [];

    // we set res equal to whatever runLevel resolves to
    let res;

    // if we pass runGame an argument...
    if (continueArgs) {
      // console.log("You called runGame with continueArgs: ", continueArgs);
      level = continueArgs.lastLevel;
      startTime = continueArgs.lastTime;
      CUMSCORE.coins = continueArgs.lastCoins;
      CUMSCORE.correctAnswers = continueArgs.lastAnswers;
    }
    // otherwise if we're starting a new game...
    else {
      level = 0;
      startTime = new Date();
      CUMSCORE.coins = [];
      CUMSCORE.correctAnswers = 0;
      CONTINUEGAMESTATS = {
        continuesUsed: 0,
        lastCoins: [],
        lastTime: new Date,
        lastLevel: 0,
        lastAnswers: 0,
      };
    }

    // helper function to keep an array of all coins
    function coinCalc(scoreCoins, responseCoins, savedCoins) {
      const total = [];
      for (a of scoreCoins) {
        total.push(a);
      }
      for (b of responseCoins) {
        total.push(b);
      }
      for (c of savedCoins) {
        total.push(c);
      }
      // console.log("new score.coin value: ", scoreCoins);
      // console.log("total: ", total);
      return total;
    };

    // while your current level is not greater than the last level...
    for (level; level < plans.length + 1;) {

      // show lives and chapter title on DOM
      document.getElementById("lives").innerHTML = String(lives);
      document.getElementById("chapter").innerHTML = titles[level];

      // check if player has gotten a loadPoint this level:
      // console.log("~ 394 checking loadVec: ", loadVec, "checking coins: ", coins);
      if (loadVec.hasOwnProperty("x")) {
        let loadLevel = new Level(plans[level], level);
      //  console.log('loadVec.x exists!: ', loadVec);
        for (let actor of loadLevel.startActors) {
          if (actor.type === "player") {
            actor.pos = loadVec;
          }
        }
        // if player has hit a loadPoint, feed runLevel the already-gotten coins && level
        res = await runLevel(loadLevel, Display, events[level], music[level], coins);
      } else {
        // otherwise feed the normal level info to runLevel
        res = await runLevel(new Level(plans[level], level),
                                Display, events[level], music[level]);
      }
      // if you win a level...
      if (res.status === "won" && level !== plans.length) {
        // clear loadVec, increase level, and add coins and answers to score
        loadVec = {};
        level++;
        CUMSCORE = {
          coins: coinCalc(CUMSCORE.coins, res.score.coins, coins),
          correctAnswers: CUMSCORE.correctAnswers += res.score.correctAnswers,
        }
        // Then clear coins out
        coins = [];
      //console.log("your score after winning: ", CUMSCORE, "plans.length: ", plans.length, "level: ", level);
      }

      // If you beat the last level...
      if (res.status === "won" && level === plans.length) {
        // clear coins and load point, update score
        coins = [];
        loadVec = {};
        CUMSCORE = {
          coins: coinCalc(CUMSCORE.coins, res.score.coins, coins),
          correctAnswers: CUMSCORE.correctAnswers += res.score.correctAnswers,
        }
        // set end time
        endTime = new Date();
        let time;

        // IIFE to convert time to a string
        (function msToTime(s) {
          const ms = s % 1000;
          s = (s - ms) / 1000;
          const secs = s % 60;
          s = (s - secs) / 60;
          const mins = s % 60;
          const hrs = (s - mins) / 60;

          time = hrs + ' hours,   ' + mins + ' minutes,   ' + secs + ' . ' + ms + ' seconds';
        })(endTime - startTime);

        // update DOM elements, and depending on player results display one of 2 sets of victory text
        document.getElementById("gameBox").style.display = "none";
        document.getElementById("status").style.display = "none";
        document.getElementById("gameBottom").style.display = "none";
        document.getElementById("endGame1").style.display = "flex";
        if ((CONTINUEGAMESTATS.continuesUsed > 0) && (CUMSCORE.coins > 150) && (CUMSCORE.correctAnswers > 4)) {
          document.getElementById("gameResult").innerHTML = "I am delighted to announce you have been accepted as the next Paladin. Your incredible intelligence, skill, and perseverance prove you have the makings of someone incredible. Please take the time to submit your score to our leaderboards on the next page.";
          document.getElementById("hasContinued").innerHTML = hasDied;
        } else {
          document.getElementById("gameResult").innerHTML = "I regret to announce, however, that we cannot accept you as a Paladin with your test results the way they are. We do have an opening for an unpaid intern if you are interested. Or you can try again...";
        }
        document.getElementById("coins").innerHTML = CUMSCORE.coins.length + "/ 232";
        document.getElementById("correctAnswers").innerHTML = CUMSCORE.correctAnswers + "/ 9";
        document.getElementById("hasContinued").innerHTML = CONTINUEGAMESTATS.continuesUsed;
        document.getElementById("time").innerHTML = time;

        // Exit runGame (and onStart) function
        return;
      }

      // if you didn't win, lose a life
      if (res.status === "lost") {lives--};

      // if you have no more lives, save gameplay stats in case of continue
      if (lives === 0) {
        CONTINUEGAMESTATS.lastCoins = CUMSCORE.coins;
        CONTINUEGAMESTATS.lastAnswers = CUMSCORE.correctAnswers;
        CONTINUEGAMESTATS.lastLevel = level;
        CONTINUEGAMESTATS.lastTime = startTime;
        CONTINUEGAMESTATS.continuesUsed++;
        //console.log("lives === 0, CUMSCORE.correctAnswers: ", CUMSCORE.correctAnswers, "res.score.answers: ", res.score.correctAnswers);

        // update score to reflect final results
        CUMSCORE = {
          coins: coinCalc(CUMSCORE.coins, res.score.coins, coins),
          correctAnswers: CUMSCORE.correctAnswers += res.score.correctAnswers,
        }

        // clear load vec
        loadVec = {};
        // console.log("game lost, loadVec updated: ", loadVec);

        // play 'you lost' song, and do more or less the same thing you do in case of victory (~450)
        audio.src = "./audio/neverSurrender.ogg";
        endTime = new Date();
        let time;
        (function msToTime(s) {// NOTE: No need to repeat this function definition
          const ms = s % 1000;
          s = (s - ms) / 1000;
          const secs = s % 60;
          s = (s - secs) / 60;
          const mins = s % 60;
          const hrs = (s - mins) / 60;

          time = hrs + ' hours,   ' + mins + ' minutes,   ' + secs + ' . ' + ms + ' seconds';
        })(endTime - startTime);
        // console.log("You've lost!");
        document.getElementById("continueGame").style.display = "flex";
        document.getElementById("submitToEmail").style.display = "none";
        document.getElementById("gameBox").style.display = "none";
        document.getElementById("status").style.display = "none";
        document.getElementById("gameBottom").style.display = "none";
        document.getElementById("coins").innerHTML = CUMSCORE.coins.length;
        document.getElementById("correctAnswers").innerHTML = CUMSCORE.correctAnswers;
        document.getElementById("hasContinued").innerHTML = CONTINUEGAMESTATS.hasContinued;
        document.getElementById("time").innerHTML = time;
        return;
      }

      // If you died but it's not game over...
      else if ( res.status === "lost" && lives !== 0) {
        // console.log("~519 - life lost, res.loadPoint: ", res.loadPoint, " res.score.coins: ", res.score.coins);
        // update the loadpoint and collect an array of coins to remove from the next playthrough
        loadVec = res.loadPoint;
        if (loadVec.hasOwnProperty("x")) {
          for (a of res.score.coins) {
            coins.push(a);
          }
        }
      //console.log("life lost, loadVec updated: ", loadVec, "coins updated: ", coins);
      }
    }
  }



  // Vector class. Used for tracking position of elements in game
  class Vec {
    constructor(x, y) {
      this.x = x; this.y = y;
    }
    plus(other) {
      return new Vec(this.x + other.x, this.y + other.y);
    }
    times(factor) {
      return new Vec(this.x * factor, this.y * factor);
    }
  }

  // Main Player Class
  class Player {
    constructor(pos, speed) {
      this.pos = pos;
      this.speed = speed;
    }

    get type() { return "player"; }

    static create(pos) {
      return new Player(pos.plus(new Vec(0, -0.5)),
                        new Vec(0, 0));
    }
  }

  // Unsure why this is separated as a prototype. Need to look into difference
  Player.prototype.size = new Vec(0.8, 1.5);


  // Level design built around (x: 8, gravity: 30, jumpSpeed: 17)
  // Better feel: (x: 7 (w/ speedup powerup??), gravity: 35, jumpSpeed: 15)
  const playerXSpeed = 7;
  const gravity = 35;
  const jumpSpeed = 19;

  // How the player is updated every frame. Called near top of state.update
  Player.prototype.update = function(time, state, keys) {
    // default xspeed to 0
    let xSpeed = 0;

    // if an arrow is pressed, change xSpeed by playerSpeed (defined above)
    if (keys.ArrowLeft) xSpeed -= playerXSpeed;
    if (keys.ArrowRight) xSpeed += playerXSpeed;

    // initialize position to old position
    let pos = this.pos;

    // init movedX and set it equal to your old position + horizontal movement
    let movedX = pos.plus(new Vec(xSpeed * time, 0));

    let platform

    if (state.level.actorTouches(state, movedX, this.size)) {
      pos = movedX;
    }

    let ySpeed;
    ySpeed = this.speed.y + time * gravity;
    let movedY = pos.plus(new Vec(0, ySpeed * time));

    // If jump speed is 'less than' (read faster than) -6
    // and you're not pressing the up arrow or touching the ground
    // then set the jump speed to -6, which stops the jump really quickly
    // Previously, I had the jump speed get closer to zero every time step
    // ySpeed was less than 0 && up wasn't pressed. This mechanic is much better
    // inpiration from sonic: http://info.sonicretro.org/SPG:Jumping
    if ((state.level.actorTouches(state, movedY, this.size)) && (ySpeed < -3) && (!keys.ArrowUp)) {
      ySpeed = -3;
    }

    if (state.level.actorTouches(state, movedY, this.size)) {
      pos = movedY;
    } else if (keys.ArrowUp && ySpeed > 0) {
      soundFX.src = "./audio/jump.wav";
      soundFX.play();
      ySpeed = -jumpSpeed;
    } else {
      ySpeed = 0;
    }
    return new Player(pos, new Vec(xSpeed, ySpeed));
  };

  class Monster {
    constructor(num, pos, speed, distance) {
      this.num = num
      this.pos = pos;
      this.speed = speed;
      this.distance = distance;
    }

    get type() { return "monster"; }
    static create(pos, ch) {
      return new Monster(ch, pos.plus(new Vec(0, -1)),
                        new Vec(1.5, 0), 120);
    }

    update(time, state) {
      // console.log("state: ", state);
      let newPos = this.pos.plus(this.speed.times(time));
      //console.log("new monster spot: ", newPos, "monster size: ", this.size, "monster speed: ", this.speed, "monster char: ", this.num);
      if (overlap(this, state.player)) {
        return new Monster(this.num, this.pos, this.speed, this.distance);
      }
      if (state.level.actorTouches(state, newPos, this.size)) {
        if (this.distance > 0) {
          return new Monster(this.num, newPos, this.speed, this.distance - 1);
        } else if (this.distance <= 0) {
          return new Monster(this.num, this.pos.plus(this.speed.times(time * -1)), this.speed.times(-1), 120);
        }
      } else {
        return new Monster(this.num, this.pos.plus(this.speed.times(time * -1)), this.speed.times(-1), this.distance);
      }
    }
    collide(state) {
      /* NOTES:
        . All this method does is:
          1. check if this monster's event has been fired
          2. if not, update the html & set state.currentEvent to this monster's event
          3. if this monster's event has bee fired, it will output its inputs unchanged

      */
      // INPUT REQUIREMENTS:

      // console.log("running monster update, state passed in: ", state);

      let speaker = state.events[this.num].npc + ": ";
      let textBox = state.events[this.num].text;

      // If this event has NOT been fired, set HTML stuff
      if (!state.events[this.num].fired) {
          document.getElementById("speaker").innerHTML = speaker;
          document.getElementById("textBox").innerHTML = textBox;
          document.getElementById("actionOptions").style.display = "flex";
          if (state.events[this.num].type === "mc") {
            document.getElementById("optionA").innerHTML = state.events[this.num].options[0].text;
            document.getElementById("optionB").innerHTML = state.events[this.num].options[1].text;
            document.getElementById("optionC").innerHTML = state.events[this.num].options[2].text;
            document.getElementById("optionD").innerHTML = state.events[this.num].options[3].text;
          } else if (state.events[this.num].type === "text") {
            document.getElementById("textResponse").style.display = "flex";
          }

        // only update current event if the event hasn't been fired yet
        //console.log("creating a new state ~625 (w/ updated currentEvent)");
        return new State(state.level, state.actors, "playing", state.events, state.score, parseInt(this.num), state.selected, state.eventPause, state.loadPoint);
      }
      /* NOTE:
          before we update we probably want to clear out numKeys so we don't accidentally log a previous keypress
          as a response to a new event
      */
      //console.log("creating a new state ~860 {update monster / event already fired}");

      return new State(state.level, state.actors, state.status, state.events, state.score, state.currentEvent, state.selected, state.eventPause, state.loadPoint);
    }
  }

  Monster.prototype.size = new Vec(1, 2);

  class Lava {
    constructor(pos, speed, reset) {
      this.pos = pos;
      this.speed = speed;
      this.reset = reset;
    }
    get type() { return "lava"; }
    static create(pos, ch) {
      // console.log("creating lava: pos:", pos, "ch: ", ch);
      if (ch == "=") {
        return new Lava(pos, new Vec(2, 0));
      } else if (ch == "|") {
        return new Lava(pos, new Vec(0, 2));
      } else if (ch == "v") {
        return new Lava(pos, new Vec(0, 3), pos);
      }
    }
  }
  Lava.prototype.size = new Vec(1, 1);
  Lava.prototype.collide = function(state) {

    soundFX.src = "./audio/death.wav";
    soundFX.play();
    // return same state but change status to 'lost', send a new score, and empty out selected
  //console.log("creating a new state ~635");
    return new State(state.level, state.actors, "lost", state.events, state.score, state.currentEvent, {}, state.eventPause, state.loadPoint);
  };
  Lava.prototype.update = function(time, state) {
    let newPos = this.pos.plus(this.speed.times(time));
    if (state.level.actorTouches(state, newPos, this.size)) {
      return new Lava(newPos, this.speed, this.reset);
    } else if (this.reset) {
      return new Lava(this.reset, this.speed, this.reset);
    } else {
      return new Lava(this.pos, this.speed.times(-1));
    }
  }
  class Coin {
    constructor(pos, basePos, wobble) {
      this.pos = pos;
      this.basePos = basePos;
      this.wobble = wobble;
    }
    get type() { return "coin"; }
    static create(pos) {
      // console.log("creating coin: pos:", pos);
      let basePos = pos.plus(new Vec(0.2, 0.1));
      return new Coin(basePos, basePos, Math.random() * Math.PI * 2);
    }
  }
  Coin.prototype.size = new Vec(0.6, 0.6);
  Coin.prototype.collide = function(state) {
    // increment score
    state.score.coins.push(this);
    soundFX.src = "./audio/coin.wav";
    soundFX.play();
    // create a filtered array for coints
    let filtered = state.actors.filter(a => a != this);
    let filteredCoins = state.actors.filter(a => a.type === "coin");
    //console.log("filteredCoins: ", filteredCoins);
    return new State(state.level, filtered, state.status, state.events, state.score, state.currentEvent, {}, state.eventPause, state.loadPoint);
  };
  const wobbleSpeed = 8, wobbleDist = 0.07;

  Coin.prototype.update = function(time) {
    let wobble = this.wobble + time * wobbleSpeed;
    let wobblePos = Math.sin(wobble) * wobbleDist;
    return new Coin(this.basePos.plus(new Vec(0, wobblePos)),
                    this.basePos, wobble);
  };

  class Level {
    constructor(plan, chapter) {
      // console.log("level, plan: ", plan);
      let rows = plan.trim().split("\n").map(l => [...l]);
      this.height = rows.length;
      this.width = rows[0].length;
      this.startActors = [];
      this.chapter = chapter;

      this.rows = rows.map((row, y) => {
        return row.map((ch, x) => {
          let type = levelChars[ch];
          if (typeof type === "string") return type;
          this.startActors.push(
            type.create(new Vec(x, y), ch)
          );
          return "empty";
        });
      });
    }
  }

  Level.prototype.touches = function(pos, size, type) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);
    for (var y = yStart; y < yEnd; y++) {
      for (var x = xStart; x < xEnd; x++) {
        let isOutside = x < 0 || x >= this.width ||
                        y < 0 || y >= this.height;
        let here = isOutside ? "stoneFill" : this.rows[y][x];
        if (here == type) return true;
      }
    }
    return false;
  };

  Level.prototype.actorTouches = function(state, moved, size) {
    const _L = state.level;
    // console.log(state.level);
    if (
      ((!_L.touches(moved.plus({x: 0, y: 0.7}), size, "cloud")) || (!_L.touches(moved, size.plus({x: 0, y: -0.5}), "cloud"))) &&
      (!_L.touches(moved, size, "grassSmall")) &&
      (!_L.touches(moved, size, "grassLeft")) &&
      (!_L.touches(moved, size, "grassCenter")) &&
      (!_L.touches(moved, size, "grassRight")) &&
      (!_L.touches(moved, size, "grassBig")) &&
      (!_L.touches(moved, size, "iceLeft")) &&
      (!_L.touches(moved, size, "iceCenter")) &&
      (!_L.touches(moved, size, "iceRight")) &&
      (!_L.touches(moved, size, "iceFill")) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "ipLeft")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "ipLeft"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "ipCenter")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "ipCenter"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "ipRight")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "ipRight"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "ipSingle")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "ipSingle"))) &&
      (!_L.touches(moved, size, "stoneLeft")) &&
      (!_L.touches(moved, size, "stoneCenter")) &&
      (!_L.touches(moved, size, "stoneRight")) &&
      (!_L.touches(moved, size, "stoneFill")) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "spLeft")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "spLeft"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "spCenter")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "spCenter"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "spRight")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "spRight"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "spSingle")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "spSingle"))) &&
      (!_L.touches(moved, size, "sandLeft")) &&
      (!_L.touches(moved, size, "sandCenter")) &&
      (!_L.touches(moved, size, "sandRight")) &&
      (!_L.touches(moved, size, "sandFill")) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "sapLeft")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "sapLeft"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "sapCenter")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "sapCenter"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "sapRight")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "sapRight"))) &&
      ((!_L.touches(moved.plus({x: 0, y: 0.5}), size, "sapSingle")) || (!_L.touches(moved, size.plus({x: 0, y: -0.2}), "sapSingle"))) &&
      (!_L.touches(moved, size, "dirt"))
    ) {
      return true;
    }
  };

  const levelChars = {

    // actors:
     "@": Player,
     "1": Monster,
     "o": Coin,

    // movingEnemies:
      "=": Lava, "|": Lava, "v": Lava,

    // staticEnemies:
      "+": "lava", "-": "lavaTop",
      "a": "water", "A": "waterTop",
      "t": "torch",

    // eventTiles:
      "P": "portal", "l": "loadPoint",

    // platforms:
      "B": "ipLeft", "N": "ipCenter", "M": "ipRight", "<": "ipSingle", //(ice platforms)
      "5": "spLeft", "6": "spCenter", "7": "spRight", "8": "spSingle", //(stone platforms)
      "T": "sapLeft", "Y": "sapCenter", "U": "sapRight", "I": "sapSingle", //(sand platforms)

    // landTop:
      "q": "grassLeft", "w": "grassCenter", "e": "grassRight",
      "b": "iceLeft", "n": "iceCenter", "m": "iceRight",
      "2": "stoneLeft", "3": "stoneCenter", "4": "stoneRight",
      "R": "sandLeft", "y": "sandCenter", "u": "sandRight",
      // more

    // filler:
       ".": "empty", "d": "dirt", ",": "iceFill", "c": "cloud", "r": "sandFill",  "#": "stoneFill",

    // decorations:
      ">" : "signLeft",
  };

  class State {
    constructor(level, actors, status, events, score, currentEvent, selected, eventPause, loadPoint) {
      // check level is an object
      if (typeof level !== "object") { console.log("Level is not an object: ", level); throw "error near 724"; }
      // if actors doesn't exist, throw error
      if (typeof actors !== "object") { console.log("actors is not an object: ", actors); throw "error ~726"; }
      // check status (only a string is acceptable)
      if (typeof status !== "string") { console.log("status is not a string: ", status); throw "error near 728" }
      // check events (must be object && at least 1 length)
      if ((typeof events !== "object") || (events.length < 1)) { console.log("events is not an object or has less than 1 length: ", events); throw "error near 731"; }
      // check score is an object
      if (typeof score !== "object") { console.log("score is not an object: ", score); throw "error near 732" }
      // check current event is a number
      if (typeof currentEvent !== "number") { console.log("currentEvent is not a number: ", currentEvent); throw "error near 734" }
      // check if selected is an object
      if (typeof selected !== "object") { console.log("selected is not an object: ", selected); throw "error near 736" }
      // check eventPause is a boolean
      if (typeof eventPause !== "boolean") { console.log("eventPause is not a boolean: ", eventPause); throw "error ~ 772"}
      // check loadPoint is an object
      if (typeof loadPoint !== "object") { console.log("loadPoint is not an object: ", eventPause); throw "error ~ 1338"}

      this.level = level;
      this.actors = actors;
      this.status = status;
      this.events = events;
      this.score = score;
      this.currentEvent = currentEvent;
      this.selected = selected;
      this.eventPause = eventPause;
      this.loadPoint = loadPoint;
    }

    static start(level, actors, status, events, score, currentEvent, selected, eventPause, loadPoint) {
      // INPUT/OUTPUT CHECKS IN PLACE
      // state.start should only be getting invoked by STARTLEVEL()
      // EXPECTED OUTPUT: an initial state that is the same every level
    //console.log("Starting new State");

      const startArgs = {
        level: {},
        actors: [],
        status: "",
        events: [],
        score: {
          coins: [],
          correctAnswers: 0,
        },
        currentEvent: 0,
        selected: {},
        eventPause: false,
        loadPoint: {},
      }
      // check level type (object required) and possibly assign actors if undefined
      if (typeof level !== "object") {
      //console.log("Level is not an object: ", level);
        throw "error near 678";
      } else {
        startArgs.level = level;
        if (typeof actors !== "undefined") {
        //console.log("actors was already defined, why? ", actors);
          throw "error ~747";
        } else startArgs.actors = level.startActors;
      }
      // check status (only a string is acceptable)
      if (typeof status !== "string") {
      //console.log("status is not a string");
        throw "error near 687"
      } else startArgs.status = status;

      // check events (must be object && at least 1 length)
      if ((typeof events !== "object") || (events.length < 1)) {
      //console.log("events is not an object or has less than 1 length: ", events);
        throw "error near 704";
      } else {
        let newEvents = [];
        let x = 0;
        events.forEach((x, index) => {
          newEvents.push(x)
          x++
        })

        // make sure events are not fired from last game:
        newEvents.forEach((x) => {
          x.fired = false;
        })
      //console.log("newEvents: ", newEvents);
        // console.log("event x has been unfired: ", newEvents);

        startArgs.events = newEvents;
      //console.log("startArgs: ", startArgs);
      }

      // Since events has been verified, update all text on screen to reflect start of state
      document.getElementById("textBox").innerHTML = startArgs.events[0].text;
      document.getElementById("speaker").innerHTML = "";
      document.getElementById("optionA").innerHTML = "";
      document.getElementById("optionB").innerHTML = "";
      document.getElementById("optionC").innerHTML = "";
      document.getElementById("optionD").innerHTML = "";
      document.getElementById("actionOptions").style.display = "none";



      if (typeof score !== "object") {
      //console.log("score is not an object: ", score);
        throw "error ~1492"
      } else startArgs.selected = score;

      // if there is a current event, throw error.
      // else, set to 0 for level start
      if (typeof currentEvent !== "number" || currentEvent !== 0) {
      //console.log("currentEvent is non-zero or NAN. Why?: ", currentEvent);
        throw "error ~ 858";
      } else {
        startArgs.currentEvent = currentEvent = 0;
      }

      // start state should have no keys selected. Check and set to empty
      if ((typeof selected === "object") && (Object.keys(selected).length !== 0)) {
      //console.log("attempted to start state with selected keys being non-empty");
        throw "error ~ 866";
      } else startArgs.selected = selected;

      // is event pause boolean?
      if ((typeof eventPause !== "boolean")) {
      //console.log("eventPause is not boolean. Why?: ", eventPause);
        throw "error ~872";
      } else startArgs.eventPause = eventPause;


      // check loadPoint is an object
      if (typeof loadPoint !== "object") {
      //console.log("loadPoint is not an object: ", loadPoint);
        throw "error ~ 1417"
      } else startArgs.loadPoint = loadPoint;

      // Log resulting startArgs object && pass into return
    //console.log("Initializing new state with the following args: ", startArgs)
      return new State(startArgs.level, startArgs.actors, startArgs.status, startArgs.events, startArgs.score, startArgs.currentEvent, startArgs.selected, startArgs.eventPause, startArgs.loadPoint);
    }

    get player() {
      return this.actors.find(a => a.type == "player");
    }
  }

  State.prototype.update = function(time, arrowKeys, events, numKeys) {
    /*
      NOTES:
        . newState.CurrentEvent should only ever be modified in the inner block of section 5

      EXPECTED INPUTS: time, arrowKeys, events, numKeys
      EXPECTED OUTPUT: (all attributes must be checked and included)
        . new State(level, actors, status, events, score, currentEvent, selected);

    */
    // 0. typecheck inputs (time: "number", arrowKeys: "object", events: array w/length > 0, numKeys: object)
    if ((typeof time === "number") && (typeof arrowKeys === "object") && ((typeof events === "object") && (events.length > 0)) && (typeof numKeys === "object")) {

      let newState = this;
      let actors = [];

      if (!this.eventPause) {

        // 1.Create map of actors, invoking each one's update method
          //  a. NOTE: update methods are self contained and only return new actors
        actors = this.actors.map(actor => actor.update(time, this, arrowKeys));

        // 2. Create 'newState' object = new State(...state + new 'actor' argument)
        // console.log("creating a new state ~863: ", newState);
        newState = new State(this.level, actors, this.status, this.events, this.score, this.currentEvent, {}, this.eventPause, this.loadPoint);
        // console.log("creating a new state ~868: ", newState);

        // 3. If newState.status !== "playing", return newState
          //  a. This stops animation and should cause a level reset
          //  b. Why call this here? Should there ever be a case where we find out here playing is false?
        if (newState.status !== "playing") return newState;

      }


      // 4. If there is a currentEvent (greater than 0 (which is the starting text)) AND that event has not been fired,
      if (Boolean(newState.currentEvent > 0) && !newState.events[newState.currentEvent].fired) {
        //console.log("there is a currentEvent > 0 && the event has not been fired");
        // a. Check if numKey has some num between 1 & 4 as a key
        if (newState.eventPause) {
          if (numKeys.hasOwnProperty('1') || numKeys.hasOwnProperty('2') || numKeys.hasOwnProperty('3') || numKeys.hasOwnProperty('4')) {

            // b. For all properties in numKey, make sure nothing is false && check there is no more than one prop
            let y = 0
            for (x in numKeys) {
              // i. If either condition is not met, throw error
              if (!x || (y > 0)) {
              //console.log("A property of numKey is false or there is more than one prop. numKey should only have one property and it should be true.");
                throw "error ~853";
              }
              y++
            }
            // c. Then set newState.selected to numKeys;
          //console.log("updating newState.selected");
            newState.selected = numKeys;
          }
        } else {
          Object.keys(numKeys).forEach(function(key) { delete numKeys[key]; });
        //console.log("event just created, cleared numKeys: ", numKeys);
          // d. If nothing has been selected but an event has been fired, set eventPause to true
          newState.eventPause = true;
        }
      };

      // 5. Check if we have selected any valid response key
      if (newState.selected.hasOwnProperty("1") || newState.selected.hasOwnProperty("2") || newState.selected.hasOwnProperty("3") || newState.selected.hasOwnProperty("4")) {
      //console.log("newState.selected has a prop!! ", newState.selected);
        // a. Check if the current event has already been 'fired'
        // NOTE: the 'fired' prop of current event is toggled to true at the end of this if block. DO NOT return anything before then
        if (!newState.events[(newState.currentEvent)].fired) {

          // b. Create selection, which is an array with one string equivalent to the key we selected
          let selection = Object.getOwnPropertyNames(newState.selected);

          // c. If all event results are there and are numbers, update the score of newState
        //console.log("newState.score: ", newState.score);
        //console.log("update score conditions: ", (typeof events[(newState.currentEvent)].options[(selection[0] - 1)].result.coins === "number") , (typeof events[(newState.currentEvent)].options[(selection[0] - 1)].result.correctAnswers === "number"));
          if ((typeof events[(newState.currentEvent)].options[(selection[0] - 1)].result.coins === "number") && (typeof events[(newState.currentEvent)].options[(selection[0] - 1)].result.correctAnswers === "number")) {
          //console.log("update score conditions met!: ", )
            let x = new Coin(0, 0);
            newState.score.correctAnswers += events[(newState.currentEvent)].options[(selection[0] -1)].result.correctAnswers;
            if (events[(newState.currentEvent)].options[(selection[0] - 1)].result.coins === 1) {
              newState.score.coins.push(x);
            }
          }
        //console.log("updated score: ", newState.score);

          // d. Update the DOM
          document.getElementById("actionOptions").style.display = "none";
          document.getElementById("speaker").innerHTML = "";
          document.getElementById("textBox").innerHTML = events[(newState.currentEvent)].options[(selection[0]) - 1].display;
          document.getElementById("optionA").innerHTML = "";
          document.getElementById("optionB").innerHTML = "";
          document.getElementById("optionC").innerHTML = "";
          document.getElementById("optionD").innerHTML = "";

          // e. Clear the selected key
          Object.keys(newState.selected).forEach(function(key) { delete newState.selected[key]; });
        //console.log("newState.selected is equal to: ", newState.selected);

          // f. Make sure we don't respond twice
          newState.events[(newState.currentEvent)].fired = true;

          // g. set event pause to false
          newState.eventPause = false;
        } else {
          // g. throw error if event @ newstate.selected has already been fired.
        //console.log("{state.update} newState.event[newState.selected] has already been fired. selected should not be mutated without checking this");
          throw "error ~ 908";
        }
      }

      // 6. Check if the player is touching static lava
        // NOTE: If implementing other 'deadly' static map objects, update here & @ levelChars
      let player = newState.player;
      if (
        (this.level.touches(player.pos, player.size, "lava")) ||
        // !state.level.touches(moved, size.plus({x: 0, y: -0.2}), "ipLeft"))
        (this.level.touches(player.pos, player.size.plus({x: 0, y: -0.8}), "lavaTop")) ||
        (this.level.touches(player.pos, player.size, "water")) ||
        (this.level.touches(player.pos, player.size.plus({x: 0, y: -0.8}), "waterTop"))
      ) {

        // a. For every event less than & including the current event, reset the fired prop to false
        for (let x = 1; x < newState.currentEvent; x++) {
        //console.log("event I'm clearing: ", newState.events[x], "newState.currentEvent: ", newState.currentEvent);
          if (newState.events[x].fired) {
            newState.events[x].fired = false;
          }
        }
      //console.log("{state.update} cleared events: ", newState.events);
        // Returning new State.
        // level, actors, status, events, score, currentEvent, selected are valid
        // only "lost" should technically matter, but still good practice
      //console.log("creating a new state ~1657");
        soundFX.src = "./audio/death.wav";
        soundFX.play();
        return new State(this.level, actors, "lost", newState.events, this.score, this.currentEvent, {}, false, this.loadPoint);
      }

      // 7. Is Playe touching the portal?
      if (this.level.touches(player.pos, player.size, "portal")) {

        // a. For every event less than & including the current event, reset the fired prop to false
        for (let x = 1; x < newState.currentEvent; x++) {
        //console.log("event I'm clearing: ", newState.events[x], "newState.currentEvent: ", newState.currentEvent);
          if (newState.events[x].fired) {
            newState.events[x].fired = false;
          }
        }
      //console.log("{state.update} cleared events: ", newState.events);
        // Returning new State.
        // level, actors, status, events, score, currentEvent, selected are valid
        // only "lost" should technically matter, but still good practice
      //console.log("creating a new state ~1017");
        return new State(this.level, actors, "won", newState.events, this.score, this.currentEvent, {}, false, this.loadPoint);

        // if player touches a load point, set load point equal to playerPosition
      } if (this.level.touches(player.pos, player.size, "loadPoint")) {
        if (this.loadPoint !== player.pos) {
          newState.loadPoint = player.pos;
        };
      }

      // 7. Handle actor collisions
        //  a. These collsions return new State objects!!!!!!!!!!
        //  b. We then set newState = returned state object
      for (let actor of actors) {
        if (actor != player && overlap(actor, player)) {
          newState = actor.collide(newState);
          // console.log("some actor returned this newState: ", newState);
        }
      }

      // LAST. Return newState
      /* TO DO:
       1. check player state returned
       2. check Monster state returned
       3. check Lava state returned
       4. check Coin state returned
      */
      return newState;
    } else {
    //console.log("{state.update} Unexpected input! time: ", time, " arrowKeys: ", arrowKeys, " events: ", events, " numKeys: ", numKeys);
      throw "err ~922";
    }
  };

  function flipHorizontally(context, around) {
    context.translate(around, 0);
    context.scale(-1, 1);
    context.translate(-around, 0);
  }

  class CanvasDisplay {
    constructor(parent, level) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = Math.min(600, level.width * scale);
      this.canvas.height = Math.min(300, level.height * scale);
      parent.appendChild(this.canvas);
      this.cx = this.canvas.getContext("2d");

      this.flipPlayer = false;
      this.playerY = 25;
      this.playerX = 0;
      this.flipMonster = true;

      this.viewport = {
        left: 0,
        top: 0,
        width: this.canvas.width / scale,
        height: this.canvas.height / scale,
      };
    }

    clear() {
      this.canvas.remove();
    }
  }

  CanvasDisplay.prototype.syncState = function(state) {
    if (!state.eventPause) {
      this.updateViewport(state);
      this.clearDisplay(state.status, state.level.chapter);
      this.drawBackground(state.level);
      this.drawActors(state.actors);
    }
  }

  CanvasDisplay.prototype.updateViewport = function(state) {
    let view = this.viewport, marginX = view.width / 3, marginY = view.width / 4;
    let player = state.player;
    let center = player.pos.plus(player.size.times(0.5));

    //console.log("view: ", view, "margin: ", margin, "player: ", player, "center: ", center);

    if (center.x < view.left + marginX) {
      view.left = Math.max(center.x - marginX, 0);
    } else if (center.x > view.left + view.width - marginX) {
      view.left = Math.min(center.x + marginX - view.width,
                           state.level.width - view.width);
    }
    if (center.y < view.top + marginY) {
      view.top = Math.max(center.y - marginY, 0);
    } else if (center.y > view.top + view.height - marginY) {
      view.top = Math.min(center.y + marginY - view.height,
                          state.level.height - view.height);
    }
  };

  CanvasDisplay.prototype.clearDisplay = function(status, level) {
    if (status === "won") {
      this.cx.fillStyle = "rgb(68, 191, 255)";
    } else if (status === "lost") {
      this.cx.fillStyle = "rgb(44, 136, 214)";
    } else if (level === 7) {
      this.cx.fillStyle = "rgb(68, 191, 255)";
    } else {
      this.cx.fillStyle = "#0e2f44";
    }
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  };

  let otherSprites = document.createElement("img");
  otherSprites.src = "./images/otherSprites.png"
  let portalSprites = document.createElement("img");
  portalSprites.src = "./images/portalRings1.png";
  let portalOverlap = 5;
  let cloudSprite = document.createElement("img");
  cloudSprite.src = "./images/cloud.png";
  let loadSprite = document.createElement("img");
  loadSprite.src = "./images/loadPoint.gif";
  let newSprites = document.createElement("img");
  newSprites.src = "./images/tiles_spritesheet.png";
  let lavaAnimation = document.createElement("img");
  lavaAnimation.src = './images/lavaAnimation.png';

  CanvasDisplay.prototype.drawBackground = function(level) {
    let {left, top, width, height} = this.viewport;
    let xStart = Math.floor(left);
    let xEnd = Math.ceil(left + width);
    let yStart = Math.floor(top);
    let yEnd = Math.ceil(top + height);

    for (let y = yStart; y < yEnd; y++) {
      // waterSwitch is used below to give a reference for what the next water frame should be
      let waterSwitch = 0;
      let lavaSwitch = 4;
      for (let x = xStart; x < xEnd; x++) {
        let tile = level.rows[y][x];
        if (tile === "empty") continue;

        let img;
        let tileX; // start X ()
        let tileY; // start Y
        let swidth = 0; // width (to grab from canvas)
        let sheight = 0; // width (to grab from canvas)
        let screenX = (x - left) * scale; // where to place on canvas x
        let screenY = (y - top) * scale; // where to place on canvas y
        let width = scale;
        let height = scale;

        switch (tile) {
          case "sapLeft":
            img = newSprites;
            tileX = 361;
            tileY = 360;
            break;
          case "sapCenter":
            img = newSprites;
            tileX = 361;
            tileY = 288;
            break;
          case "sapRight":
            img = newSprites;
            tileX = 361;
            tileY = 216;
            break;
          case "sapSingle":
            img = newSprites;
            tileX = 360;
            tileY = 432;
            break;
          case "sandFill":
            img = newSprites;
            tileX = 577;
            tileY = 865;
            break;
          case "sandLeft":
            img = newSprites;
            tileX = 288;
            tileY = 648;
            break;
          case "sandCenter":
            img = newSprites;
            tileX = 289;
            tileY = 576;
            break;
          case "sandRight":
            img = newSprites;
            tileX = 289;
            tileY = 504;
            break;
          case "ipLeft":
            img = newSprites;
            tileX = 217;
            tileY = 576;
            break;
          case "ipCenter":
            img = newSprites;
            tileX = 217;
            tileY = 504;
            break;
          case "ipRight":
            img = newSprites;
            tileX = 217;
            tileY = 432;
            break;
          case "ipSingle":
            img = newSprites;
            tileX = 217;
            tileY = 648;
            break;
          case "iceFill":
            img = newSprites;
            tileX = 721;
            tileY = 865;
            break;
          case "iceLeft":
            img = newSprites;
            tileX = 145;
            tileY = 864;
            break;
          case "iceCenter":
            img = newSprites;
            tileX = 145;
            tileY = 792;
            break;
          case "iceRight":
            img = newSprites;
            tileX = 145;
            tileY = 720;
            break;
          case "spLeft":
            img = newSprites;
            tileX = 431;
            tileY = 723;
            break;
          case "spCenter":
            img = newSprites;
            tileX = 649;
            tileY = 651;
            break;
          case "spRight":
            img = newSprites;
            tileX = 795;
            tileY = 651;
            break;
          case "spSingle":
            img = newSprites;
            tileX = 792;
            tileY = 360;
            break;
          case "stoneFill":
            img = newSprites;
            tileX = 505;
            tileY = 289;
            break;
          case "stoneLeft":
            img = newSprites;
            tileX = 793;
            tileY = 216;
            break;
          case "stoneCenter":
            img = newSprites;
            tileX = 793;
            tileY = 144;
            break;
          case "stoneRight":
            img = newSprites;
            tileX = 793;
            tileY = 71;
            sheight = 66;
            break;
          case "waterTop":
            img = newSprites;
            let  waterTile = ((Math.floor(Date.now() / 250) % 8 + waterSwitch++) % 8);
            tileX = 433 + waterTile * 8;
            tileY = 581;
            swidth = 12;
            screenY += 5;
            if (waterSwitch > 8) {waterSwitch = 0};
            break;
          case "water":
            img = newSprites;
            tileX = 505;
            tileY = 215;
            break;
          case "grassBig":
            img = newSprites;
            tileX = 650;
            tileY = 0;
            break;
          case "grassLeft":
            img = newSprites;
            tileX = 505;
            tileY = 648;
            break;
          case "grassCenter":
            img = newSprites;
            tileX = 505;
            tileY = 576;
            break;
          case "grassRight":
            img = newSprites;
            tileX = 505;
            tileY = 504;
            break;
          case "dirt":
            img = newSprites;
            tileX = 577;
            tileY = 866;
            break;
          case "lavaTop":
            img = lavaAnimation;
            let  lavaTile = ((Math.floor(Date.now() / 250) % 8 + lavaSwitch++) % 8);
            tileX = 0 + lavaTile * 8;
            tileY = 0;
            swidth = 70;
            sheight = 70;
            screenY += 5;
            if (lavaSwitch > 8) {lavaSwitch = 0};
            break;
          case "lava":
            img = newSprites;
            tileX = 505;
            tileY = 0;
            break;
          case "torch":
            img = newSprites;
            tileX = 71;
            let torchNum = Math.floor(Date.now() / 60) % 2;
            tileY = 143 + (torchNum * 73);
            break;
          case "loadPoint":
            img = loadSprite;
            let loadNum = Math.floor(Date.now() / 110) % 4;
            tileX = loadNum * 32;
            tileY = 0;
            swidth = 32;
            sheight = 32;
            height += 12;
            width += 12;
            screenY -= 20;
            break;
          case "cloud":
            img = cloudSprite;
            tileX = 0;
            tileY = 0;
            swidth = scale;
            sheight = scale;
            break;
          case "portal":
            img = portalSprites;
            let portalNum = Math.floor(Date.now() / 60) % 17;
            tileX = portalNum * 45;
            tileY = 0;
            swidth = 45;
            sheight = 45;
            screenY -= 15;
            width = 35;
            height = 35;
            break;
          case "signLeft":
            img = newSprites;
            tileX = 292;
            tileY = 215;
            break;
          default:
            console.log("no type assigned to tile: ", tile);
        }
        if (swidth === 0) {swidth = 68};
        if (sheight === 0) {sheight = 68};
        // args: 1. what to draw, 2. where to start the drawing at x
        // 3. where to start drawing at y, 4. width of image, 5. height of image
        // 6. where to place the image (x) 7. where to place the image(y) 8. width to size the image to
        // 9. height to size the image to
        // console.log("drawing background. tile: ", tile, " tileX: ", tileX, "width: ", width, "height: ", height, " x: ", x, " y: ", y);
        this.cx.drawImage(img,
                            tileX,         tileY, swidth, sheight,
                            screenX, screenY, width, height);
      }
    }
  };

  let playerSprites = document.createElement("img");
  playerSprites.src = "./images/playerWalking.png";
  const playerXOverlap = 24;

  CanvasDisplay.prototype.drawPlayer = function(player, x, y,
                                                width, height) {
    width += playerXOverlap * 2;
    x -= playerXOverlap;
    if (player.speed.x != 0) {
      this.flipPlayer = player.speed.x < 0;
    }

    let playerSrc;
    let j = player.speed.y;
    if (-15 <= j && j !== 0 && j <= 15) { // making sure in range 1..11
    // console.log("j: ", j);
      this.playerY = 153;
      if (j >= 7) {
        // console.log("j > 5");
        this.playerX = 6;
        // console.log("j >= 9! this.playerX: ", this.playerX);
      } else if (j >= 5) {
        // console.log("j > 2");
        this.playerX = 5;
        // console.log("j >= 1! this.playerX: ", this.playerX);
      } else if (j > 3) {
        this.playerX = 4;
        // console.log("j >= -1! this.playerX: ", this.playerX);
      } else if (j >= -3) {
        this.playerX = 4;
        // console.log("j >= 4! this.playerX: ", this.playerX);
      } else if (j <= -11) {
        this.playerX = 0;
        // console.log("j <= -11! this.playerX: ", this.playerX);
      } else if (j <= -9) {
        this.playerX = 1;
        // console.log("j <= -9! this.playerX: ", this.playerX);
      } else if (j <= -4) {
        this.playerX = 2;
        // console.log("j <= -4! this.playerX: ", this.playerX);
      } else if (j <= 0) {
        this.playerX = 3;
        // console.log("j <= -2! this.playerX: ", this.playerX);
      }
    } else if (player.speed.x === 0) {
      if (this.playerY === 153 && this.playerX === 4) {
        this.playerX = 7;
      } else {
        this.playerY = 25;
        this.playerX = Math.floor(Date.now() / 50) % 4;
        //console.log("j === 0! this.playerX: ", this.playerX);
      }
    } else if (player.speed.x != 0) {
      if (this.playerY === 153 && this.playerX === 4) {
        this.playerX = 7;
      } else {
        this.playerY = 89;
        this.playerX = Math.floor(Date.now() / 2) % 8;
      }
    }

    this.cx.save();
    if (this.flipPlayer) {
      flipHorizontally(this.cx, x + width / 2);
    }
    let tileX = this.playerX * width;
    // item after playerX x was 0
    // console.log("here is the y position: ", this.playerY, "here is the tilex: ", tile);
    this.cx.drawImage(playerSprites, tileX, this.playerY, width, height,
                                     x,      y, width, height);
    this.cx.restore();
  };

  let monsterSprites = document.createElement("img");
  monsterSprites.src = "./images/paladinWalking.png";

  CanvasDisplay.prototype.drawActors = function(actors) {
    for (let actor of actors) {
      //console.log("actor.type: ", actor.type);
      let width = actor.size.x * scale;
      let height = actor.size.y * scale;
      let x = (actor.pos.x - this.viewport.left) * scale;
      let y = (actor.pos.y - this.viewport.top) * scale;
      if (actor.type === "player") {
        this.drawPlayer(actor, x, y, width, height);
      } else {
        let tileX;
        let tile;
        if (actor.type === "monster") {
          width = 120;
          height = 94;
          // console.log("monster speed: ", actor.speed);
          if (actor.speed.x != 0) {
            this.flipMonster = actor.speed.x < 0;
            // console.log("speed not zero!, ", this.flipMonster);
          }
          if (actor.speed != 0) {
            tile = Math.floor(Date.now() / 90) % 6;
          }
          this.cx.save();
          if (this.flipMonster) {
            // console.log("flipping monster: ", this.cs, x + width / 2);
            flipHorizontally(this.cx, (x -= 85) + width / 2);
          }
          tileX = tile * width;
          // console.log("drawing paladin. tileX: ", tileX, "width: ", width, "height: ", height, " x: ", x, " y: ", y);
          this.cx.drawImage(monsterSprites, tileX, 0, width, height,
                                            x,     (y + 1), 45, 38);
          this.cx.restore();

        } else {
          if (actor.type === "coin") {
            tileX = 2 * scale + 1;
          } else if (actor.type === "lava") {
            tileX = scale;
          }
          this.cx.drawImage(otherSprites,
                            tileX, 0, width, height,
                            x,     y, width, height);
        }
      }
    }
  };



  // Invoke the function that kicks it all off now that everything has been declared
  // All args are necessary except preDeathScore, which is only given in case of a continue
  runGame(GAME_LEVELS, GAME_EVENTS, CHAPTER_TITLES, TRACKS, CanvasDisplay, preDeathScore);
}
