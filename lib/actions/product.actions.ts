"use server"
import { prisma } from "@/lib/prisma";
import { unstable_cache as cache, revalidateTag } from "next/cache";

interface CreateProductInput {
    name: string;
    description: string;
    price: number;
    category: string;
    images?: string[];
}
// Read All (pagination)
export async function getProducts({
    page = 1,
    name,
    minPrice,
    category }: {
        page?: number,
        name?: string,
        minPrice?: string,
        category?: string
    }) {
    const perPage = 5;
    const skip = (page - 1) * perPage;
    const filterCategory = category !== "all";

    try {
        const allProducts = await prisma.product.findMany({
            include: { images: true, reviews: true },
            where: {
                name: { contains: name, mode: 'insensitive' },
                ...(filterCategory && { category }),
                ...(minPrice && { price: { gte: parseInt(minPrice) } }),
            },
            skip,
            take: perPage,
        });
        // { id, name, description, price, category, images[], reviews[] }

        const products = allProducts.map((product) => ({
            ...product,
            avgRating: Math.floor(product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length) || 0,
            image: product.images[0]?.url
        }));
        // { id, name, description, price, category, images[], reviews[] ,averageRating, image[0] }

        return products;
    } catch (error) {
        console.error(error);
        return [];
    }
}
// Read (cache)
async function _getProductyById(id: number) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true, reviews: true },
        });
        return product;
    } catch (error) {
        console.error(error);
        return null;
    }
}
export const getProductById = cache(_getProductyById, ['getProductById'], {
    tags: ['Product'],
    revalidate: 60, // Re-fetch the data every 60 seconds
});

// Create
export async function createProduct(product: CreateProductInput) {
    try {
        const newProduct = await prisma.product.create({
            data: {
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                // create a new Image record for each image URL
                images: { create: product.images?.map((url) => ({ url })) },
            }
        });
        return newProduct;
    } catch (error) {
        console.error('Error creating product:', error);
    }
}

// Update
export async function updateProduct(id: number, product: CreateProductInput) {
    try {
        const updateProduct = await prisma.product.update({
            where: { id },
            data: {
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                images: {
                    deleteMany: {},
                    create: product.images?.map((url) => ({ url }))
                },
            }
        });
        // Mark the data as stale, and re-fetch it from the database
        revalidateTag('Product');
        return updateProduct;
    } catch (error) {
        console.error('Error updating product:', error);
    }
}

// Delete
export async function deleteProduct(id: number) {
    try {
        await prisma.product.delete({ where: { id } });
        // Mark the data as stale, and re-fetch it from the database
        revalidateTag('Product');
        return true;
    } catch (error) {
        console.error('Error deleting product:', error);
        return false;
    }
}