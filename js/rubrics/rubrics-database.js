// ========== RUBRICS DATABASE STRUCTURE ========== //
// This defines how rubrics are stored in Firebase

class RubricsDatabase {
    constructor() {
        // Rubric types (completely separate from articles)
        this.TYPES = {
            recipes: {
                id: 'recipes',
                name: '🍽️ Рецепти',
                icon: '🍽️',
                color: '#FF6B6B',
                description: 'Вкусни рецепти и кулинарни съвети'
            },
            interesting: {
                id: 'interesting',
                name: '🔍 Интересно',
                icon: '🔍',
                color: '#4ECDC4',
                description: 'Любопитни факти и истории'
            },
            jokes: {
                id: 'jokes',
                name: '😂 Шеги',
                icon: '😂',
                color: '#FFD166',
                description: 'Смешни вицове и анекдоти'
            }
        };
        
        // Initialize Firebase if not already
        if (typeof db === 'undefined') {
            console.error('Firebase database not initialized!');
        }
    }

    // Get all rubric types
    getAllTypes() {
        return Object.values(this.TYPES);
    }

    // Get type by ID
    getTypeById(typeId) {
        return this.TYPES[typeId];
    }

    // Create a new rubric in Firebase
    async createRubric(rubricData) {
        try {
            // Validate required fields
            if (!rubricData.type || !rubricData.title || !rubricData.content || !rubricData.author) {
                throw new Error('Моля, попълнете всички задължителни полета');
            }

            // Validate type
            if (!this.TYPES[rubricData.type]) {
                throw new Error('Невалиден тип рубрика');
            }

            // Add metadata
            const fullRubricData = {
                ...rubricData,
                date: new Date().toISOString(),
                published: true,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            // Save to Firebase
            const newRef = await db.ref('rubrics').push(fullRubricData);
            
            return {
                success: true,
                id: newRef.key,
                message: 'Рубриката е създадена успешно!'
            };

        } catch (error) {
            console.error('Error creating rubric:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all rubrics
    async getAllRubrics(limit = 50) {
        try {
            const snapshot = await db.ref('rubrics')
                .orderByChild('date')
                .limitToLast(limit)
                .once('value');

            const rubrics = [];
            snapshot.forEach(child => {
                const rubric = child.val();
                rubric.id = child.key;
                rubrics.push(rubric);
            });

            // Sort by date (newest first)
            rubrics.sort((a, b) => new Date(b.date) - new Date(a.date));

            return {
                success: true,
                rubrics: rubrics
            };

        } catch (error) {
            console.error('Error getting rubrics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get rubrics by type
    async getRubricsByType(type, limit = 20) {
        try {
            const snapshot = await db.ref('rubrics')
                .orderByChild('date')
                .once('value');

            const rubrics = [];
            snapshot.forEach(child => {
                const rubric = child.val();
                if (rubric.type === type) {
                    rubric.id = child.key;
                    rubrics.push(rubric);
                }
            });

            // Sort by date (newest first) and limit
            rubrics.sort((a, b) => new Date(b.date) - new Date(a.date));
            const limited = rubrics.slice(0, limit);

            return {
                success: true,
                rubrics: limited,
                total: rubrics.length
            };

        } catch (error) {
            console.error('Error getting rubrics by type:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete a rubric
    async deleteRubric(rubricId) {
        try {
            await db.ref('rubrics/' + rubricId).remove();
            return {
                success: true,
                message: 'Рубриката е изтрита успешно!'
            };
        } catch (error) {
            console.error('Error deleting rubric:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Update a rubric
    async updateRubric(rubricId, updateData) {
        try {
            await db.ref('rubrics/' + rubricId).update(updateData);
            return {
                success: true,
                message: 'Рубриката е обновена успешно!'
            };
        } catch (error) {
            console.error('Error updating rubric:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get statistics
    async getStatistics() {
        try {
            const snapshot = await db.ref('rubrics').once('value');
            
            const stats = {
                total: 0,
                byType: {},
                recentCount: 0
            };

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            snapshot.forEach(child => {
                const rubric = child.val();
                stats.total++;
                
                // Count by type
                if (!stats.byType[rubric.type]) {
                    stats.byType[rubric.type] = 0;
                }
                stats.byType[rubric.type]++;
                
                // Count recent (last week)
                const rubricDate = new Date(rubric.date);
                if (rubricDate > oneWeekAgo) {
                    stats.recentCount++;
                }
            });

            return {
                success: true,
                stats: stats
            };

        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Make globally available
window.RubricsDB = new RubricsDatabase();