const { json } = require("express");
const DButils = require("./DButils");
const { password } = require("pg/lib/defaults");
const SERVER_URL = process.env.SERVER_URL;

async function markAsFavorite(username, recipe_id) {
  // add validations?
  await DButils.execQuery(
    `insert into user_favorite (user_name, recipe_id) values ('${username}',${recipe_id})`
  );
}

async function markAsViewed(username, recipe_id) {
  await DButils.execQuery(
    `DELETE FROM user_watched WHERE user_name='${username}' AND recipe_id=${recipe_id}`
  );
  await DButils.execQuery(
    `insert into user_watched (user_name, recipe_id) values ('${username}',${recipe_id})`
  );
}

async function getViewedStatus(username, recipeIds) {
  // Replace this with your actual implementation to check the user_watched table
  const viewedRecipes = await getViewedRecipesFromList(username, recipeIds);
  return recipeIds.map((id) => ({
    id,
    viewed: viewedRecipes.includes(id),
  }));
}

async function getViewedRecipesFromList(username, recipeIds) {
  if (!recipeIds || recipeIds.length === 0) {
    return [];
  }
  const idsForQuery = recipeIds.join(",");
  const recipes = await DButils.execQuery(
    `SELECT recipe_id FROM user_watched WHERE user_name='${username}' AND recipe_id IN (${idsForQuery})`
  );
  return recipes.map((row) => row.recipe_id);
}

async function getViewedRecipes(username, amount = null) {
  let query = `SELECT recipe_id FROM user_watched WHERE user_name = '${username}'`;
  if (amount) {
    query += `ORDER BY recipe_id DESC LIMIT ${amount}`;
  }
  const recipeIds = await DButils.execQuery(query);
  return recipeIds.map((row) => row.recipe_id);
}

async function getFavoriteStatus(username, recipeIds) {
  // Replace this with your actual implementation to check the user_watched table
  const favoriteRecipes = await getFavoriteRecipesFromList(username, recipeIds);
  return recipeIds.map((id) => ({
    id,
    favorite: favoriteRecipes.includes(id),
  }));
}

async function getFavoriteRecipesFromList(username, recipeIds) {
  if (!recipeIds || recipeIds.length === 0) {
    return [];
  }
  const idsForQuery = recipeIds.join(",");
  const recipes = await DButils.execQuery(
    `SELECT recipe_id FROM user_favorite WHERE user_name = '${username}' AND recipe_id IN (${idsForQuery})`
  );
  return recipes.map((row) => row.recipe_id);
}

async function getFavoriteRecipes(username) {
  const recipeIds = await DButils.execQuery(
    `select recipe_id from user_favorite where user_name='${username}'`
  );
  return recipeIds.map((row) => row.recipe_id);
}

function validateRecipe(recipe) {
  return "";
}

async function saveRecipe(username, recipe) {
  const errorMessage = validateRecipe(recipe);
  if (errorMessage) {
    throw { status: 400, message: errorMessage };
  } else {
    // Fetch the latest ID from the recipe table
    const resultLastId = await DButils.execQuery(
      `SELECT id FROM recipe ORDER BY CAST(id AS UNSIGNED) DESC LIMIT 1`
    );

    let nextId;
    if (resultLastId.length > 0) {
      const lastId = resultLastId[0].id;
      nextId = "0" + (parseInt(lastId) + 1).toString();
    } else {
      nextId = "01";
    }

    // Insert the new recipe with the generated ID
    await DButils.execQuery(
      `INSERT INTO recipe (id, title, preview, summary, cuisine, servings, ready_in_minutes, vegan, vegetarian, gluten_free, ingredients, instructions, photo_url)
        VALUES ('${nextId}', '${recipe.name}', '${recipe.preview}', '${recipe.summary}', '${recipe.cuisine}', ${recipe.servings},
        ${recipe.time}, ${recipe.vegan}, ${recipe.vegetarian}, ${recipe.glutenFree}, '${recipe.ingredients}', '${recipe.instructions}', '${recipe.photoUrl}')`
    );

    // Insert into the user_recipe table
    await DButils.execQuery(
      `INSERT INTO user_recipe (user_name, recipe_id) VALUES ('${username}', '${nextId}')`
    );
  }
}

function parseRecipeDetails(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    summary: recipe.preview,
    readyInMinutes: recipe.ready_in_minutes,
    vegan: recipe.vegan,
    vegetarian: recipe.vegetarian,
    glutenFree: recipe.glutenFree,
    cuisine: recipe.cuisine,
    viewed: true,
    favorite: true,
    image: SERVER_URL + recipe.photo_url,
  };
}

function parseRecipeFullDetails(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    readyInMinutes: recipe.ready_in_minutes,
    summary: recipe.preview,
    vegan: Boolean(recipe.vegan),
    vegetarian: Boolean(recipe.vegetarian),
    glutenFree: Boolean(recipe.glutenFree),
    cuisine: recipe.cuisine,
    instructions: recipe.instructions,
    extendedIngredients: recipe.ingredients,
    image: SERVER_URL + recipe.photo_url,
    servings: recipe.servings,
  };
}

async function getPrivateRecipes(username) {
  const result = await DButils.execQuery(
    `SELECT recipe_id FROM user_recipe where user_name='${username}'`
  );
  const recipeIds = result.map((row) => row.recipe_id);
  // If no recipes found, return an empty array
  if (recipeIds.length === 0) {
    return [];
  }
  idForQuery = recipeIds.join(",");
  const recipes = await DButils.execQuery(
    `SELECT * FROM recipe WHERE id IN (${idForQuery})`
  );
  recipesPreview = recipes.map((recipe) => parseRecipeDetails(recipe));
  return recipesPreview;
}

async function getRecipeFullDetails(recipeId) {
  const recipe = await DButils.execQuery(
    `SELECT * FROM recipe WHERE id=${recipeId}`
  );
  return parseRecipeFullDetails(recipe[0]);
}

async function getRecipeProgress(username, recipeId) {
  const result = await DButils.execQuery(
    `SELECT progress FROM user_meal WHERE user_name='${username}' AND recipe_id='${recipeId}'`
  );
  if (!result || result.length === 0) {
    await DButils.execQuery(
      `INSERT INTO user_meal (user_name, recipe_id, progress) VALUES ('${username}', '${recipeId}', 1)`
    );
    return 1;
  }
  return result[0].progress;
}

function parseRecipeInstructions(recipe, progress) {
  const instructions = recipe.instructions;
  const allSteps = [];
  instructions.forEach((step, index) => {
    allSteps.push({
      stepDescription: step,
      stepNumber: index + 1,
    });
  });
  return {
    steps: allSteps,
    progress: progress,
  };
}

async function getRecipeInstructions(recipeId, progress) {
  const recipe = await DButils.execQuery(
    `SELECT * FROM recipe WHERE id=${recipeId}`
  );
  return parseRecipeInstructions(recipe[0], progress);
}

async function updateRecipeProgress(username, recipeId, progress) {
  const deleteQuery = `
    DELETE FROM user_meal 
    WHERE user_name = '${username}' AND recipe_id = '${recipeId}';
  `;
  
  const insertQuery = `
    INSERT INTO user_meal (user_name, recipe_id, progress) 
    VALUES ('${username}', '${recipeId}', ${progress});
  `;
  
  await DButils.execQuery(deleteQuery);
  await DButils.execQuery(insertQuery);
}

async function getMeal(username) {
  const result = await DButils.execQuery(
    `SELECT * FROM user_meal WHERE user_name='${username}'`
  );
  return result;
}

async function getRecipeMealData(recipeId, progress) {
  let recipe = await getRecipeFullDetails(recipeId);
  let analyzedInstructions = await getRecipeInstructions(recipeId, progress);
  recipe.progress = progress;
  recipe.numberOfInstructions = analyzedInstructions.steps.length;
  return {
    recipe: recipe,
    analyzedInstructions: analyzedInstructions,
  };
}

async function deleteRecipeFromMeal(username, recipeId) {
  await DButils.execQuery(
    `DELETE FROM user_meal WHERE user_name='${username}' AND recipe_id='${recipeId}'`
  );
}

async function deleteMeal(username) {
  await DButils.execQuery(
    `DELETE FROM user_meal WHERE user_name='${username}'`
  );
}

async function getMealSize(username) {
  const result = await DButils.execQuery(
    `SELECT COUNT(*) FROM user_meal WHERE user_name='${username}'`
  );
  return result[0]["COUNT(*)"];
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.markAsViewed = markAsViewed;
exports.getViewedRecipes = getViewedRecipes;
exports.saveRecipe = saveRecipe;
exports.getPrivateRecipes = getPrivateRecipes;
exports.getRecipeFullDetails = getRecipeFullDetails;
exports.getViewedStatus = getViewedStatus;
exports.getFavoriteStatus = getFavoriteStatus;
exports.getRecipeProgress = getRecipeProgress;
exports.getRecipeInstructions = getRecipeInstructions;
exports.updateRecipeProgress = updateRecipeProgress;
exports.getMeal = getMeal;
exports.getRecipeMealData = getRecipeMealData;
exports.deleteRecipeFromMeal = deleteRecipeFromMeal;
exports.deleteMeal = deleteMeal;
exports.getMealSize = getMealSize;
