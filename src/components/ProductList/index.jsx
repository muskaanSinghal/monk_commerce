import { useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";

import ProductField from "../ProductField";
import ProductPicker from "../ProductPicker";
import Modal from "../ui/Modal";

import styles from "./ProductList.module.css";

const ProductList = () => {
    const [selectedProducts, setSelectedProducts] = useState([{ isEmpty: true, id: `product-${0}` }]);
    // Initializing with an empty row.
    const [editingField, setEditingField] = useState(-1);

    const selectedProductsSet = useMemo(() => {
        return new Set(selectedProducts.map((pro) => pro.id));
    }, [selectedProducts]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        const activeLevel = active.data.current?.level;
        const overLevel = over.data.current?.level;

        // Dropped outside
        if (!over) return;
        // Dropped over itself
        if (active.id === over.id) return;

        if (activeLevel === "product" && overLevel === "product") {
            // Update product orders
            setSelectedProducts((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }

        if (activeLevel === "variant" &&
            overLevel === "variant" &&
            active.data.current?.productIndex === over.data.current?.productIndex
        ) {
            const index = active.data.current?.productIndex;
            // Updating variant orders
            setSelectedProducts((prev) => (prev.map((prod, idx) => {
                if (idx === index) {
                    const variants = prod.variants;
                    const oldIndex = variants.findIndex((i) => i.id === active.id);
                    const newIndex = variants.findIndex((i) => i.id === over.id);

                    return {
                        ...prod,
                        variants: arrayMove(variants, oldIndex, newIndex),
                    }
                }

                return prod;
            })))
        }

    }

    const handleFieldEdit = (idx) => {
        // Open picker
        setEditingField(idx);
    }

    const handleModalClose = () => {
        setEditingField(-1);
    }

    // Update selected products based on the products selected from picker.
    const handleProductsSelection = (updatedProductList, index) => {
        if (index < 0) return;

        setSelectedProducts((prev) => {
            const updatedProducts = [...prev];
            updatedProducts.splice(index, 1, ...updatedProductList);
            return updatedProducts;
        })
    }

    /**
     * Util function for updating discount value and type 
     * key - product key
     */
    const handleFieldDiscountEdit = (key, value, index) => {
        setSelectedProducts((prev) => (prev.map((prod, idx) => {
            if ((index) === idx) return { ...prod, [key]: value };
            return prod;
        })))
    }

    const handleAddNewField = () => {
        setSelectedProducts((prev) => ([...prev, { isEmpty: true, id: `product-${selectedProducts?.length}` }]));
    }

    /**
     * index - selected product index.
     * variantId - selected variant to be removed.
     */
    const handleVariantDeselect = (index, variantId) => {
        setSelectedProducts((prev) => (prev.map((prod, idx) => {
            if (idx === index) {
                return {
                    ...prod,
                    variants: prod.variants.filter((variant) => {
                        return variant?.id !== variantId
                    })
                };
            }
            return prod;
        })))
    }

    const handleProductDeselect = (productId) => {
        setSelectedProducts((prev) => (prev.filter((prod) => {
            return prod.id !== productId
        })));
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <DndContext onDragEnd={handleDragEnd}>
                    <div className={styles["product-list"]}>
                        <h2 className={styles["product-list__title"]}>Add Products</h2>

                        <div className={`${styles.product__header}`}>
                            <h3>Product</h3>
                            <h3>Discount</h3>
                        </div>

                        <SortableContext items={selectedProducts.map((p) => p.id)}>
                            {selectedProducts.map((pro, idx) =>
                                <ProductField
                                    product={pro}
                                    key={String(pro.id || `product-${idx}`)}
                                    index={idx + 1}
                                    onFieldEdit={handleFieldEdit}
                                    onFieldDiscountEdit={handleFieldDiscountEdit}
                                    onProductDeselect={handleProductDeselect}
                                    onVariantDeselect={handleVariantDeselect}
                                    showClear={selectedProducts?.length > 1}
                                />)}
                        </SortableContext>
                    </div>
                </DndContext>

                <button
                    className={`${styles["cta__add-product"]} btn`}
                    onClick={handleAddNewField}
                >
                    Add Product
                </button>
            </div>

            {editingField > -1 && (
                <Modal>
                    <ProductPicker
                        onClose={handleModalClose}
                        onAdd={handleProductsSelection}
                        fieldIdx={editingField}
                        alreadySelectedProducts={selectedProductsSet}
                        currentFieldData={selectedProducts[editingField]}
                    />
                </Modal>
            )}
        </div>
    )
}

export default ProductList;