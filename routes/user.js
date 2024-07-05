var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const userUtils = require("./utils/userUtils");
const recipeUtils = require("./utils/recipesUtils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.username) {
    query = `SELECT 1 FROM users WHERE user_name = '${req.session.username}'`;
    DButils.execQuery(query)
      .then((result) => {
        if (result && result.length > 0) {
          next();
        } else {
          res.sendStatus(401);
        }
      })
      .catch((err) => next(err));
  } else {
    res.sendStatus(401);
  }
});

/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post("/markFavorite", async (req, res, next) => {
  try {
    const username = req.session.username;
    const recipe_id = req.body.recipeId;
    await userUtils.markAsFavorite(username, recipe_id);
    res.status(200).send({
      message: "The Recipe successfully saved as favorite",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * This path gets body with recipeId and save this recipe in the viewed list of the logged-in user
 */
router.post("/markViewed", async (req, res, next) => {
  try {
    const username = req.session.username;
    const recipe_id = req.body.recipeId;
    await userUtils.markAsViewed(username, recipe_id);
    res.status(200).send({
      message: "The Recipe successfully marked as viewed",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get("/favorites", async (req, res, next) => {
  try {
    const username = req.session.username;
    const favoriteRecipes = await userUtils.getFavoriteRecipes(username);
    const viewedStatusArray = await userUtils.getFavoriteStatus(
      username,
      favoriteRecipes
    );
    const recipesInfoArray = viewedStatusArray.map((recipe) => ({
      id: recipe.id,
      viewed: recipe.viewed,
      favorite: true,
    }));
    const results = await recipeUtils.getRecipesPreview(recipesInfoArray);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

router.get("/lastViewed/:amount", async (req, res, next) => {
  try {
    const username = req.session.username;
    let amount = req.params.amount || 5;
    const viewedRecipes = await userUtils.getViewedRecipes(username, amount);
    const favoriteStatusArray = await userUtils.getFavoriteStatus(
      username,
      viewedRecipes
    );
    const recipesInfoArray = favoriteStatusArray.map((recipe) => ({
      id: recipe.id,
      viewed: true,
      favorite: recipe.favorite,
    }));
    const results = await recipeUtils.getRecipesPreview(recipesInfoArray);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

router.post("/saveRecipe", async (req, res, next) => {
  try {
    const {
      title,
      preview,
      summary,
      photo,
      cuisine,
      vegan,
      vegetarian,
      glutenFree,
      ingredients,
      instructions,
      servings,
      readyInMinutes,
    } = req.body;
    const recipe = {
      title,
      preview,
      summary,
      photo,
      cuisine,
      vegan,
      vegetarian,
      glutenFree,
      ingredients,
      instructions,
      servings,
      readyInMinutes,
    };
    userUtils.saveRecipe(req.session.username, recipe);
    res.status(200).send({
      message: "The Recipe was succesfuly saved",
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/private", async (req, res, next) => {
  try {
    const username = req.session.username;
    const results = await userUtils.getPrivateRecipes(username);
    res.status(200).send(results);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/private/:recipeId", async (req, res, next) => {
  try {
    const recipe = await userUtils.getRecipeFullDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
