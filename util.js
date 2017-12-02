/**
 * The function that does all the replacing
 * @param {string} word The word which will have its' characters replaced
 * @param {string[]} characters An array containing the characters which will be kept
 * @returns {string} A string containing all characters not in the characters array replaced by underscores
 */
const showCurrentWord = (word, characters) => {
    const letters = word.split('');
    const replacedLetters = letters.map(char => (char === ' ' || characters.includes(char.toLowerCase())) ? char : '_');
    return replacedLetters.join(' ');
};

module.exports = {
    showCurrentWord
};