const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.SPOONACULAR_API_KEY
        }
    });
}

async function getRecipeFullDetails(recipe_id) {
    let instructions = [];
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, summary, cuisines, servings, aggregateLikes, vegan, vegetarian, glutenFree, analyzedInstructions } = recipe_info.data;
    if (analyzedInstructions && analyzedInstructions.length > 0 && analyzedInstructions[0].steps && analyzedInstructions[0].steps.length > 0) {
        for (let i = 0; i < analyzedInstructions[0].steps.length; i++) {
            instructions.push(analyzedInstructions[0].steps[i].step);
        }
    }
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
        instructions: instructions,
        cuisines: cuisines,
        servings: servings

    }
}


async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
}

async function searchRecipe(recipeName, cuisine, diet, intolerance, number, username) {
    const response = await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeName,
            cuisine: cuisine,
            diet: diet,
            intolerances: intolerance,
            number: number,
            apiKey: process.env.SPOONACULAR_API_KEY
        }
    });
    console.log(response.data.results);
    return getRecipesPreview(response.data.results.map((element) => element.id), username);
}



exports.getRecipeDetails = getRecipeDetails;
exports.getRecipeFullDetails = getRecipeFullDetails;
exports.searchRecipe = searchRecipe;


