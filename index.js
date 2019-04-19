const inquirer = require("inquirer");
const fetch = require("node-fetch");

// function to display welcome message
const displayWelcomeMessage = () => {
  console.log("Welcome to the Dad Joke Generator");
};

// function to prompt the user to chose how much training data to use
const askHowMany = () => {
  const questions = [
    {
      name: "training",
      type: "input",
      message:
        "How many dad jokes do you want to use for training data? (min = 100, max = 549)"
    }
  ];
  return inquirer.prompt(questions);
};

// function to fetch paginated data
const fetchTrainingData = async limit => {
  console.log("Fetching training data...");
  limit < 100 ? (limit = 100) : limit;
  fetchJokes = async (limit, page = 1, results = []) => {
    return await fetch(
      `https://icanhazdadjoke.com/search?limit=${limit}&page=${page}`,
      { headers: { Accept: "application/json" } }
    )
      .then(data => data.json())
      .then(async data => {
        console.log(data.total_jokes);
        results.push(...data.results);
        if (results.length < limit && data.total_jokes > results.length) {
          await fetchJokes(limit, page + 1, results);
        }
        return results;
      });
  };
  return await fetchJokes(limit);
};

// function to generate symantic map
const generateSymanticMap = data => {
  console.log("Generating language map...");
  let symanticMap = {
    startWordsQuestions: {},
    startWordsReplies: {},
    nextWordsQuestions: {},
    nextWordsReplies: {}
  };
  data.forEach(row => {
    let split = row.joke.split("?");
    // only include Q&A type jokes
    if (
      split.length === 2 &&
      row.joke.indexOf("\r\n\r\n") === -1 &&
      row.joke.indexOf(",") === -1
    ) {
      // extract and store question start words
      let question = (split[0] + "?").split(" ");
      symanticMap.startWordsQuestions[question[0]]
        ? symanticMap.startWordsQuestions[question[0]]++
        : (symanticMap.startWordsQuestions[question[0]] = 1);
      let answer = (split[1].replace(".", "").replace("!", "") + ".")
        .trim()
        .split(" ");
      // extract and store reply start words
      if (!symanticMap.startWordsReplies[question[0]])
        symanticMap.startWordsReplies[question[0]] = {};
      symanticMap.startWordsReplies[question[0]][answer[0]]
        ? symanticMap.startWordsReplies[question[0]][answer[0]]++
        : (symanticMap.startWordsReplies[question[0]][answer[0]] = 1);
      // extract and store next words for questions
      question.forEach((word, i) => {
        if (question[i + 1]) {
          if (!symanticMap.nextWordsQuestions[word])
            symanticMap.nextWordsQuestions[word] = {};
          symanticMap.nextWordsQuestions[word][question[i + 1]]
            ? symanticMap.nextWordsQuestions[word][question[i + 1]]++
            : (symanticMap.nextWordsQuestions[word][question[i + 1]] = 1);
        }
      });
      // extract and store next words for answers
      answer.forEach((word, i) => {
        if (answer[i + 1]) {
          if (!symanticMap.nextWordsReplies[word])
            symanticMap.nextWordsReplies[word] = {};
          symanticMap.nextWordsReplies[word][answer[i + 1]]
            ? symanticMap.nextWordsReplies[word][answer[i + 1]]++
            : (symanticMap.nextWordsReplies[word][answer[i + 1]] = 1);
        }
      });
    }
  });
  return symanticMap;
};

// function to generate a new joke
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
    newJoke.push(selectWord(map.nextWordsReplies[newJoke[newJoke.length - 1]]));
  }
  console.log("-----");
  console.log(newJoke.join(" "));
  console.log("-----");
};

// function to select probabalistic random word
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

// function to prompt the user to generate another joke
const askForMore = async symaticMap => {
  const questions = [
    {
      name: "more",
      type: "input",
      message: "Do you want to hear another joke? y/n"
    }
  ];
  let response = await inquirer.prompt(questions);
  if (response.more === "y" || response.more === "Y" || response.more === "") {
    generateJoke(symaticMap);
    await askForMore(symaticMap);
  }
};

// main function
const run = async () => {
  displayWelcomeMessage();
  const volume = await askHowMany();
  console.log("-----");
  const trainingData = await fetchTrainingData(volume.training);
  const semanticMap = generateSymanticMap(trainingData);
  const joke = generateJoke(semanticMap);
  await askForMore(semanticMap);
};

run();
