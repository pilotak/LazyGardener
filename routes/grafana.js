module.exports = function (router) {
  router.route('/').get(function (req, res, next) {
    res.render('pages/grafana', {
      page: 'grafana',
      title: 'Grafana'
    })
  })
}
