var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const userUtils = require("./utils/userUtils");
const recipeUtils = require("./utils/recipesUtils");
const authUtils = require("./utils/authUtils");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to filename
  },
});

const upload = multer({ storage: storage });

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.username) {
    authUtils
      .validateUsername(req.session.username)
      .then((result) => {
        if (result) {
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
    const recipeId = req.body.recipeId;
    await userUtils.markAsViewed(username, recipeId);
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
    const viewedStatusArray = await userUtils.getViewedStatus(
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
    let amount = req.params.amount || 4;
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

router.post("/saveRecipe", upload.single("photo"), async (req, res, next) => {
  try {
    const {
      name,
      preview,
      summary,
      cuisine,
      diets,
      ingredients,
      instructions,
      servings,
      time,
    } = req.body;
    console.log(req.body);
    const vegan = diets.includes("vegan");
    const vegetarian = diets.includes("vegetarian");
    const glutenFree = diets.includes("gluten_free");

    // The uploaded file can be accessed as req.file
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const recipe = {
      name,
      preview,
      summary,
      cuisine,
      vegan,
      vegetarian,
      glutenFree,
      ingredients,
      instructions,
      servings,
      time,
      photoUrl,
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

module.exports = router;
