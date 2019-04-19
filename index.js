const inquirer = require("inquirer");
const figlet = require("figlet");
const shell = require("shelljs");
const fetch = require("node-fetch");

const welcomeMessage = () => {
  console.log("Welcome to the Dad Joke Generator");
};

const getInput = () => {
  const questions = [
    {
      name: "training",
      type: "input",
      message:
        "How many dad jokes do you want to use for training data? (min = 100, max = 1000)"
    }
  ];
  return inquirer.prompt(questions);
};

const fetchTrainingData = async limit => {
  console.log("Fetching training data...");
  limit < 100 ? (limit = 100) : limit;
  fetchJokes = async (limit, page = 1, results = []) => {
    return await fetch(
      `https://icanhazdadjoke.com/search?limit=${limit}&page=${page}`,
      {
        headers: { Accept: "application/json" }
      }
    )
      .then(data => data.json())
      .then(async data => {
        results.push(...data.results);
        if (results.length < limit && data.total_jokes > results.length) {
          await fetchJokes(limit, page + 1, results);
        }
        return results;
      });
  };
  return await fetchJokes(limit);
};

const generateMap = data => {
  console.log("Generating language map...");
  let map = {
    startWordsQuestions: {},
    startWordsReplies: {},
    nextWordsQuestions: {},
    nextWordsAnswers: {}
  };
  data.forEach(row => {
    let split = row.joke.split("?");
    if (
      split.length === 2 &&
      row.joke.indexOf("\r\n\r\n") === -1 &&
      row.joke.indexOf(",") === -1
    ) {
      // extract and store start words
      let question = (split[0] + "?").split(" ");
      map.startWordsQuestions[question[0]]
        ? map.startWordsQuestions[question[0]]++
        : (map.startWordsQuestions[question[0]] = 1);
      let answer = (split[1].replace(".", "").replace("!", "") + ".")
        .trim()
        .split(" ");

      if (!map.startWordsReplies[question[0]])
        map.startWordsReplies[question[0]] = {};
      map.startWordsReplies[question[0]][answer[0]]
        ? map.startWordsReplies[question[0]][answer[0]]++
        : (map.startWordsReplies[question[0]][answer[0]] = 1);

      // extract and store next words
      question.forEach((word, i) => {
        if (question[i + 1]) {
          if (!map.nextWordsQuestions[word]) map.nextWordsQuestions[word] = {};
          map.nextWordsQuestions[word][question[i + 1]]
            ? map.nextWordsQuestions[word][question[i + 1]]++
            : (map.nextWordsQuestions[word][question[i + 1]] = 1);
        }
      });
      answer.forEach((word, i) => {
        if (answer[i + 1]) {
          if (!map.nextWordsAnswers[word]) map.nextWordsAnswers[word] = {};
          map.nextWordsAnswers[word][answer[i + 1]]
            ? map.nextWordsAnswers[word][answer[i + 1]]++
            : (map.nextWordsAnswers[word][answer[i + 1]] = 1);
        }
      });
    }
  });
  return map;
};

const generateJoke = map => {
  console.log("Generating joke...");

  let newJoke = [];
  newJoke.push(selectWord(map.startWordsQuestions));
  while (newJoke[newJoke.length - 1].indexOf("?") === -1) {
    newJoke.push(
      selectWord(map.nextWordsQuestions[newJoke[newJoke.length - 1]])
    );
  }
  newJoke.push(selectWord(map.startWordsReplies[newJoke[0]]));
  while (newJoke[newJoke.length - 1].indexOf(".") === -1) {
    newJoke.push(selectWord(map.nextWordsAnswers[newJoke[newJoke.length - 1]]));
  }

  console.log("-----");
  console.log(newJoke.join(" "));
  console.log("-----");
};

const selectWord = data => {
  let random = Math.random();
  let max = { word: null, score: 0 };
  Object.keys(data).forEach(key => {
    let randomized = Math.random() * data[key];
    if (randomized > max.score) {
      max = { word: key, score: randomized };
    }
  });

  return max.word;
};

const askForMore = async map => {
  const questions = [
    {
      name: "more",
      type: "input",
      message: "Do you want to hear another joke? y/n"
    }
  ];
  let response = await inquirer.prompt(questions);
  if (response.more === "y" || response.more === "Y" || response.more === "") {
    generateJoke(map);
    await askForMore(map);
  }
};

const run = async () => {
  welcomeMessage();
  const question = await getInput();
  console.log("-----");
  const trainingData = await fetchTrainingData(question.training);
  const map = generateMap(trainingData);
  const joke = generateJoke(map);
  await askForMore(map);
};

run();
