import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import Logger from '../lib/logger';
import { socketService } from '../services/socketService';

export const getFeed = async (req: Request, res: Response) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
                author: {
                    select: { id: true, name: true, color: true, role: true }
                },
                reactions: true,
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: { select: { id: true, name: true } }
                    }
                }
            }
        });
        res.json(posts);
    } catch (error) {
        Logger.error('Error fetching feed', error);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
};

export const createPost = async (req: Request, res: Response) => {
    try {
        const { content, attachments } = req.body;
        // @ts-ignore
        const authorId = req.user?.userId;

        const post = await prisma.post.create({
            data: {
                content,
                attachments: attachments || [],
                authorId
            },
            include: {
                author: { select: { id: true, name: true, color: true } },
                comments: true,
                reactions: true
            }
        });

        socketService.emit('feed:new_post', post);
        res.status(201).json(post);
    } catch (error) {
        Logger.error('Error creating post', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
};

export const addComment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // postId
        const { content } = req.body;
        // @ts-ignore
        const authorId = req.user?.userId;

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: id,
                authorId
            },
            include: {
                author: { select: { id: true, name: true } }
            }
        });

        socketService.emit(`feed:post_updated`, { postId: id, type: 'comment', comment });
        res.status(201).json(comment);
    } catch (error) {
        Logger.error('Error adding comment', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const toggleReaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // postId
        const { type } = req.body; // e.g. 'LIKE'
        // @ts-ignore
        const authorId = req.user?.userId;

        // Check if exists
        const existing = await prisma.reaction.findUnique({
            where: {
                authorId_postId: {
                    authorId,
                    postId: id
                }
            }
        });

        if (existing) {
            if (existing.type === type) {
                // Remove reaction (toggle off)
                await prisma.reaction.delete({ where: { id: existing.id } });
            } else {
                // Change reaction
                await prisma.reaction.update({
                    where: { id: existing.id },
                    data: { type }
                });
            }
        } else {
            // Create
            await prisma.reaction.create({
                data: {
                    postId: id,
                    authorId,
                    type
                }
            });
        }

        socketService.emit(`feed:post_reaction_updated`, { postId: id, userId: authorId });

        res.json({ success: true });
    } catch (error) {
        Logger.error('Error toggling reaction', error);
        res.status(500).json({ error: 'Failed to react' });
    }
};
