import { useState } from "react";
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, useSortable } from "@dnd-kit/sortable";

import styles from "./ProductField.module.css";

/**
 * Component representing each variant row in the listing page.
 */
const VariantField = ({ variant, showClear, onVariantDeselect, productIndex }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({
        id: variant.id,
        animateLayoutChanges: () => false,
        // Added data prop for identifying child/ parent dragging.
        data: {
            level: "variant",
            productIndex: productIndex - 1,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div className={styles.product__variant} ref={setNodeRef} style={style}>
            <div className={styles.variant__info}>
                <button className={styles.cta__drag} {...attributes} {...listeners}></button>
                <div className={`shadow rounded`}>{variant?.title}</div>
            </div>

            {showClear && <button
                className={styles.cta__clear}
                onClick={() => {
                    onVariantDeselect(productIndex - 1, variant?.id);
                }}
            ></button>}
        </div>
    )
}

/**
 * Component representing each product row in the listing page.
 */
const ProductField = ({
    product = {},
    index,
    onFieldEdit,
    onFieldDiscountEdit,
    onProductDeselect,
    onVariantDeselect,
    showClear
}) => {
    const { isEmpty, title, variants = [], id = `product-${index}` } = product;
    const areMultiVariantsPresent = variants?.length > 1;

    const [addingDiscount, setAddingDiscount] = useState(false);
    const [showVariants, setShowVariants] = useState(false);

    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: product.id,
        data: {
            level: "product",
        },
        animateLayoutChanges: () => false
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        scaleX: 1,
        scaleY: 1
    };

    const handleDiscountToggle = () => {
        setAddingDiscount(true);
    }

    const handleFieldDiscount = (e) => {
        onFieldDiscountEdit(e.target.name, e.target.value, index - 1);
    }

    const toggleVariants = () => setShowVariants((prev) => !prev);

    return (
        <div
            className={`${styles.product} ${isEmpty ? styles["product--empty"] : ""}`}
            ref={setNodeRef}
            style={style}
        >
            <div className={styles.product__details}>
                <button className={styles.cta__drag} {...attributes} {...listeners}></button>

                <div className={styles.product__info}>
                    <p className={styles.product__index}>{index}.</p>
                    <div className={`${styles.product__title} shadow`}>
                        <span>{isEmpty ? "Select Product" : title}</span>
                        <button
                            className={styles.cta__edit}
                            onClick={() => {
                                onFieldEdit(index - 1);// 0 based
                            }}
                        >
                        </button>
                    </div>
                </div>

                <div className="product__discount">
                    {
                        addingDiscount ?
                            <div className={`${styles.discount__field} `}>
                                <input
                                    type="number"
                                    className="shadow"
                                    defaultValue={0}
                                    name="discount_value"
                                    onChange={handleFieldDiscount}
                                />
                                <select
                                    name="discount_type"
                                    className="shadow"
                                    onChange={handleFieldDiscount}
                                >
                                    <option>% off</option>
                                    <option>flat off</option>
                                </select>
                            </div> :
                            <button
                                onClick={handleDiscountToggle}
                                className="btn small-filled"
                                disabled={isEmpty}
                            >
                                Add Discount
                            </button>
                    }
                </div>
                {/* Button to remove current product */}
                {showClear &&
                    <button
                        className={styles.cta__clear}
                        onClick={() => {
                            onProductDeselect(id);
                        }}
                    ></button>}
            </div>

            {(!isEmpty && areMultiVariantsPresent) &&
                <button className={`${styles["toggle-variants"]} align-end`}>
                    <span
                        className="title"
                        onClick={toggleVariants}
                    >
                        {showVariants ? "Hide" : "Show"} Variants
                    </span>
                    <span className={`${!showVariants && styles.rotate}`}></span>
                </button>}

            {/* Expanded content */}
            {(showVariants || !areMultiVariantsPresent) &&
                <SortableContext items={variants.map((v) => v.id)}>
                    <div className={styles.product__variants}>
                        {variants?.map((variant) => (
                            <VariantField
                                key={`variant-${variant?.id}`}
                                variant={variant}
                                showClear={variants?.length > 1}
                                onVariantDeselect={onVariantDeselect}
                                productIndex={index}
                            />
                        ))}
                    </div>
                </SortableContext>
            }
        </div>
    )
}

export default ProductField;