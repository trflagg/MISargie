
module.exports = function() {
  return {
    waitString: '{% wait(%d) %}',
    waitRegEx: /^{% wait\((\d+)\) %}$/,

    clearScreenString: '{% clearScreen() %}',
    clearScreenRegEx: /^{% clearScreen\(\) %}$/
  }
}()
