const { User, App, ApiKey, sequelize, Sequelize } = require('../../db/models');
const { Op } = Sequelize;

/**
 * @swagger
 * /api/apps:
 *   get:
 *     summary: Get all apps for the authenticated user
 *     tags: [Apps]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of apps
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/App'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
const getUserApps = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const apps = await App.findAll({
      where: { userId },
      include: [{
        model: ApiKey,
        where: {
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        required: false
      }]
    });
    
    return res.status(200).json({
      success: true,
      data: apps
    });
  } catch (error) {
    console.error('Error fetching user apps:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/apps/{id}:
 *   get:
 *     summary: Get app details by ID
 *     tags: [Apps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: App ID
 *     responses:
 *       200:
 *         description: App details
 *       404:
 *         description: App not found
 *       401:
 *         description: Not authenticated
 */
const getAppById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const app = await App.findOne({
      where: {
        id,
        userId
      },
      include: [{
        model: ApiKey,
        where: {
          isActive: true,
          expiresAt: { [Op.gt]: new Date() }
        },
        required: false
      }]
    });
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found or you do not have access'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: app
    });
  } catch (error) {
    console.error('Error fetching app details:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/apps/{id}:
 *   put:
 *     summary: Update app details
 *     tags: [Apps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: App ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [website, mobile]
 *     responses:
 *       200:
 *         description: App updated successfully
 *       404:
 *         description: App not found
 *       401:
 *         description: Not authenticated
 */
const updateApp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, domain, type } = req.body;
    
    // Find the app first to verify ownership
    const app = await App.findOne({
      where: {
        id,
        userId
      }
    });
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found or you do not have access'
      });
    }
    
    // Update app details
    await app.update({
      name: name || app.name,
      domain: domain || app.domain,
      type: type || app.type
    });
    
    return res.status(200).json({
      success: true,
      message: 'App updated successfully',
      data: app
    });
  } catch (error) {
    console.error('Error updating app:', error);
    next(error);
  }
};

/**
 * @swagger
 * /api/apps/{id}:
 *   delete:
 *     summary: Delete an app
 *     tags: [Apps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: App ID
 *     responses:
 *       200:
 *         description: App deleted successfully
 *       404:
 *         description: App not found
 *       401:
 *         description: Not authenticated
 */
const deleteApp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Find the app first to verify ownership
      const app = await App.findOne({
        where: {
          id,
          userId
        },
        transaction
      });
      
      if (!app) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'App not found or you do not have access'
        });
      }
      
      // Revoke all API keys
      await ApiKey.update(
        { isActive: false },
        {
          where: { appId: id },
          transaction
        }
      );
      
      // Delete the app
      await app.destroy({ transaction });
      
      // Commit the transaction
      await transaction.commit();
      
      return res.status(200).json({
        success: true,
        message: 'App deleted successfully'
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting app:', error);
    next(error);
  }
};

module.exports = {
  getUserApps,
  getAppById,
  updateApp,
  deleteApp
}; 