var express = require("express");
var router = express.Router();
const recipesUtils = require("./utils/recipesUtils");
const authUtils = require("./utils/authUtils");
const userUtils = require("./utils/userUtils");

function getUserName(req) {
  let username = null;
  if (req.session && req.session.username) {
    username = req.session.username;
  }
  return username;
}

/**
 * This path is for searching a recipe
 */
router.post("/search", async (req, res, next) => {
  try {
    const queryName = req.body.queryName;
    const cuisines = req.body.cuisines;
    const diets = req.body.diets;
    const intolerances = req.body.intolerances;
    const amount = req.body.amount || 5;
    const username = getUserName(req);

    const result = await recipesUtils.searchRecipes(
      queryName,
      cuisines,
      diets,
      intolerances,
      amount,
      username
    );

    res.send(result);
  } catch (error) {
    next(error);
  }
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipeId = req.params.recipeId;
    if (recipeId[0] !== "0") {
      const recipe = await recipesUtils.getRecipeFullDetails(
        req.params.recipeId
      );
      res.status(200).send(recipe);
    } else {
      const recipe = await userUtils.getRecipeFullDetails(req.params.recipeId);
      console.log(recipe);
      res.status(200).send(recipe);
    }
  } catch (error) {
    next(error);
  }
});

router.get("/random/:amount", async (req, res, next) => {
  try {
    const amount = req.params.amount;
    const username = getUserName(req);
    const result = await recipesUtils.getRandomRecipes(amount, username);
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
