const DButils = require("./DButils");

async function markAsFavorite(username, recipe_id) {
  // add validations?
  await DButils.execQuery(
    `insert into user_favorite (user_name, recipe_id) values ('${username}',${recipe_id})`
  );
}

async function markAsViewed(username, recipe_id) {
  // add validations?
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
    `SELECT recipe_id FROM user_watched WHERE id IN (${idsForQuery})`
  );
  return recipes.map((row) => row.recipe_id);
}

async function getViewedRecipes(username, amount = null) {
  let query = `SELECT recipe_id FROM user_watched WHERE user_name='${username}'`;
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
    `SELECT recipe_id FROM user_favorite WHERE id IN (${idsForQuery})`
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
    const ingredients = JSON.stringify(recipe.ingredients);
    const instructions = JSON.stringify(recipe.instructions);
    result = await DButils.execQuery(
      `insert into recipe (title, preview, summary, cuisine, servings, ready_in_minutes, vegan, vegetarian, gluten_free , ingredients, instructions)
        values ('${recipe.title}', '${recipe.preview}', '${recipe.summary}', '${recipe.cuisine}', ${recipe.servings},
          ${recipe.readyInMinutes}, ${recipe.vegan}, ${recipe.vegetarian}, ${recipe.glutenFree}, '${ingredients}', '${instructions}')`
    );
    const recipeId = result.insertId;

    await DButils.execQuery(
      `insert into user_recipe (user_name, recipe_id) values ('${username}', ${recipeId})`
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
  };
}

function parseRecipeFullDetails(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    readyInMinutes: recipe.ready_in_minutes,
    summary: recipe.summmary,
    vegan: recipe.vegan,
    vegetarian: recipe.vegetarian,
    glutenFree: recipe.glutenFree,
    cuisine: recipe.cuisine,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients,
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

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.markAsViewed = markAsViewed;
exports.getViewedRecipes = getViewedRecipes;
exports.saveRecipe = saveRecipe;
exports.getPrivateRecipes = getPrivateRecipes;
exports.getRecipeFullDetails = getRecipeFullDetails;
exports.getViewedStatus = getViewedStatus;
exports.getFavoriteStatus = getFavoriteStatus;
