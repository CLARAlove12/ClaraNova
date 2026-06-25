const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { createCategorieValidator, updateCategorieValidator, categorieIdValidator } = require('../validators/categories.validator');

router.get('/', authenticate, categoriesController.getAllCategories);
router.get('/:id', authenticate, categorieIdValidator, categoriesController.getCategorieById);
router.post('/', authenticate, authorize('admin'), createCategorieValidator, auditLog('CREATE_CATEGORIE'), categoriesController.createCategorie);
router.put('/:id', authenticate, authorize('admin'), updateCategorieValidator, auditLog('UPDATE_CATEGORIE'), categoriesController.updateCategorie);
router.delete('/:id', authenticate, authorize('admin'), categorieIdValidator, auditLog('DELETE_CATEGORIE'), categoriesController.deleteCategorie);

module.exports = router;