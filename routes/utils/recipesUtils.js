const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const userUtils = require("./userUtils");
const generalUtils = require("./GeneralUtils");

async function callRandomRecipes(amount) {
  return await axios.get(`${api_domain}/random`, {
    params: {
      number: amount,
      includeNutrition: false,
      apiKey: process.env.SPOONACULAR_API_KEY,
    },
  });
}

async function getRecipeInformation(recipeId) {
  console.log(recipeId);
  return await axios.get(`${api_domain}/${recipeId}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.SPOONACULAR_API_KEY,
    },
  });
}

async function getRecipeAnalyzedInstructions(recipeId) {
  return await axios.get(`${api_domain}/${recipeId}/analyzedInstructions`, {
    params: {
      apiKey: process.env.SPOONACULAR_API_KEY,
    },
  });
}

async function callSearchRecipes(
  queryName,
  cuisines,
  diets,
  intolerances,
  amount
) {
  dietsAsString = diets ? diets.join(",") : "";
  intoleranceAsString = intolerances ? intolerances.join(",") : "";
  cuisinesAsString = cuisines ? cuisines.join(",") : "";
  return await axios.get(`${api_domain}/complexSearch`, {
    params: {
      query: queryName,
      cuisine: cuisinesAsString,
      diet: dietsAsString,
      intolerances: intoleranceAsString,
      number: amount,
      apiKey: process.env.SPOONACULAR_API_KEY,
    },
  });
}

async function getViewedStatus(username, recipeIds) {
  const viewedRecipes = await userUtils.getViewedStatus(username, recipeIds);
  return recipeIds.map((id) => viewedRecipes.includes(id));
}

async function getFavoriteStatus(username, recipeIds) {
  const favoriteRecipies = await userUtils.getFavoriteStatus(
    username,
    recipeIds
  );
  return recipeIds.map((id) => favoriteRecipies.includes(id));
}

async function fetchRecipeInstructions(recipeId, progress) {
  const instructions = await getRecipeAnalyzedInstructions(recipeId);
  const allSteps = [];
  let stepNumber = 1;
  instructions.data.forEach((part) => {
    part.steps.forEach((stepObj) => {
      allSteps.push({
        recipeName: part.name,
        equipment: stepObj.equipment,
        stepNumber: stepNumber++,
        stepDescription: stepObj.step,
        ingredients: stepObj.ingredients,
      });
    });
  });
  result = {
    steps: allSteps,
    progress: progress,
  };
  return result;
}

async function getRecipeFullDetails(recipeId) {
  let instructions = [];
  let recipeInfo = await getRecipeInformation(recipeId);
  console.log(recipeInfo);
  let {
    id,
    title,
    readyInMinutes,
    image,
    summary,
    cuisines,
    servings,
    aggregateLikes,
    extendedIngredients,
    vegan,
    vegetarian,
    glutenFree,
    analyzedInstructions,
  } = recipeInfo.data;
  if (
    analyzedInstructions &&
    analyzedInstructions.length > 0 &&
    analyzedInstructions[0].steps &&
    analyzedInstructions[0].steps.length > 0
  ) {
    for (let i = 0; i < analyzedInstructions[0].steps.length; i++) {
      instructions.push(analyzedInstructions[0].steps[i].step);
    }
  }
  const cuisine = cuisines ? cuisines.join(", ") : "";
  return {
    id: id,
    title: title,
    readyInMinutes: readyInMinutes,
    image: image,
    aggregateLikes: aggregateLikes,
    vegan: vegan,
    vegetarian: vegetarian,
    glutenFree: glutenFree,
    summary: summary,
    extendedIngredients: extendedIngredients,
    instructions: instructions,
    cuisine: cuisine,
    servings: servings,
    analyzedInstructions: analyzedInstructions,
  };
}

function parseRecipeDetails(recipeInfo) {
  const preview = recipeInfo.summary.split(".")[0] + ".";
  return {
    id: recipeInfo.id,
    title: recipeInfo.title,
    readyInMinutes: recipeInfo.readyInMinutes,
    image: recipeInfo.image,
    aggregateLikes: recipeInfo.aggregateLikes,
    vegan: recipeInfo.vegan,
    summary: preview,
    vegetarian: recipeInfo.vegetarian,
    glutenFree: recipeInfo.glutenFree,
  };
}

async function getRecipeDetails(recipeId) {
  let recipeInfo = await getRecipeInformation(recipeId);
  return parseRecipeDetails(recipeInfo.data);
}

async function getRecipesPreview(recipesInfoArray) {
  let promises = [];
  recipesInfoArray.map((recipeInfo) =>
    promises.push(getRecipeDetails(recipeInfo.id))
  );
  let recipes_info = await Promise.all(promises);
  let recipes = [];
  recipes_info.map((recipeInfo, index) => {
    let recipe = {
      ...recipeInfo,
      viewed: recipesInfoArray[index].viewed,
      favorite: recipesInfoArray[index].favorite,
    };
    recipes.push(recipe);
  });
  return recipes;
}

async function getRandomRecipes(amount, username) {
  if (!amount || !generalUtils.isNumeric(amount) || amount <= 0) {
    throw { status: 400, message: "amount should be a positive integer" };
  }
  const recipes_response = await callRandomRecipes(amount);
  const recipes = recipes_response.data.recipes;
  let returnedRecipes = [];
  for (const recipe of recipes) {
    let recipeInfo = parseRecipeDetails(recipe);
    returnedRecipes.push(recipeInfo);
  }
  if (username) {
    let recipeIds = returnedRecipes.map((recipe) => recipe.id);
    let viewedRecipes = await getViewedStatus(username, recipeIds);
    let favoriteRecipes = await getFavoriteStatus(username, recipeIds);
    returnedRecipes = returnedRecipes.map((recipe, index) => ({
      ...recipe,
      viewed: viewedRecipes[index],
      favorite: favoriteRecipes[index],
    }));
  }
  return returnedRecipes;
}

async function searchRecipes(
  queryName,
  cuisines,
  diets,
  intolerances,
  amount,
  username
) {
  if (!amount || !generalUtils.isNumeric(amount) || amount <= 0) {
    throw { status: 400, message: "amount should be a positive integer" };
  }
  const recipes_response = await callSearchRecipes(
    queryName,
    cuisines,
    diets,
    intolerances,
    amount
  );
  let result = recipes_response.data.results;
  recipeIds = result.map((recipe) => recipe.id);
  let recipesInfoArray = [];
  if (username) {
    let viewedRecipes = await getViewedStatus(username, recipeIds);
    let favoriteRecipes = await getFavoriteStatus(username, recipeIds);
    recipesInfoArray = recipeIds.map((id, index) => ({
      id: id,
      viewed: viewedRecipes[index],
      favorite: favoriteRecipes[index],
    }));
  } else {
    recipesInfoArray = recipeIds.map((id) => ({
      id: id,
      viewed: false,
      favorite: false,
    }));
  }

  result = await getRecipesPreview(recipesInfoArray);
  return result;
}

async function getRecipeInstructions(recipeId, username) {
  let recipe;
  let progress = 1;
  if (username) {
    progress = await userUtils.getRecipeProgress(username, recipeId);
  }
  if (recipeId[0] !== "0") {
    recipe = await fetchRecipeInstructions(recipeId, progress);
  } else {
    recipe = await userUtils.getRecipeInstructions(recipeId, progress);
  }
  return recipe;
}

async function getRecipeMealData(recipeId, progress) {
  let recipe = await getRecipeDetails(recipeId);
  let analyzedInstructions = await fetchRecipeInstructions(recipeId, progress);
  recipe.progress = progress;
  recipe.numberOfInstructions = analyzedInstructions.steps.length;
  return {
    recipe: recipe,
    analyzedInstructions: analyzedInstructions,
  };
}

async function getMeal(userName) {
  let promises = [];
  const recipes = await userUtils.getMeal(userName);
  recipes.forEach((recipe) => {
    const recipeId = recipe.recipe_id;
    const progress = recipe.progress;
    if (recipeId[0] != "0") {
      promises.push(getRecipeMealData(recipeId, progress));
    } else {
      promises.push(userUtils.getRecipeMealData(recipeId, progress));
    }
  });
  let recipes_info = await Promise.all(promises);
  return recipes_info;
}

exports.getRecipeDetails = getRecipeDetails;
exports.getRecipeFullDetails = getRecipeFullDetails;
exports.searchRecipes = searchRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipeInstructions = getRecipeInstructions;
exports.getMeal = getMeal;
