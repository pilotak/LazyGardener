module.exports = function (router) {
  router.route('/').get(function (req, res, next) {
    res.render('pages/terminal', {
      page: 'terminal',
      title: 'Terminal'
    })
  })
}
