const showCurrentWord = (word, characters) => {
    const letters = word.split('');
    const replacedLetters = letters.map(char => (char === ' ' || characters.includes(char.toLowerCase())) ? char : '_');
    const lettersWithSpaces = replacedLetters.map(char => char + ' ').join('');
    return lettersWithSpaces.substring(0, lettersWithSpaces.length - 1);
};

module.exports = {
    showCurrentWord
};