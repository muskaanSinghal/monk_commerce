import { useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

import { fetchProducts } from "../../services/apiService";

import styles from "./ProductPicker.module.css";

/**
 * Each product row on picker component.
 */
const Product = ({ details = {}, selectedIds = [], onProductSelect, onVariantSelect }) => {
    const { title, variants, image = {}, id } = details;
    const variantIds = variants?.map((variant) => `variant-${id}-${variant?.id}`);
    const productId = `product-${id}`;

    return (
        <div className={styles.picker__product}>
            <div className={`${styles.product__details} checkbox`}>
                <input
                    type="checkbox"
                    id={productId}
                    checked={selectedIds.includes(productId)}
                    onChange={() => {
                        onProductSelect(productId, variantIds);
                    }}
                />
                <label htmlFor={`product-${id}`}></label>
                {image?.src ?
                    <img
                        className={styles.product__img}
                        src={image?.src || "../../assets/icons/icon-search.svg"}
                        alt={title}
                        height={36}
                        width={36}
                    /> :
                    <span
                        className={styles["product__img--placeholder"]}
                    ></span>}
                <span className={styles.product__title}>{title}</span>
            </div>
            {/* Variants */}
            <div className={styles.product__variants}>
                {variants.map((variant) => {
                    const variantId = `variant-${id}-${variant?.id}`;
                    const availableInventory = variant?.inventory_quantity;

                    return (
                        <div className={styles.product__variant}>
                            <div className={`${styles.variant__details} checkbox`}>
                                <input
                                    type="checkbox"
                                    id={`variant-${variant?.id}`}
                                    checked={selectedIds.includes(variantId)}
                                    onChange={() => {
                                        onVariantSelect(variantId, { productId, variantIds });
                                    }}
                                />
                                <label htmlFor={`variant-${variant?.id}`}></label>
                                <span>{variant?.title}</span>
                            </div>
                            {/* As an ui improvement we may add addition restriction here if the product is unavailable */}
                            {/* Abs value since sometimes value is negative (I am not sure) */}
                            <span>
                                {availableInventory > 0 ? `${Math.abs(availableInventory)} available` : ""}
                            </span>

                            <span>${variant?.price}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const ProductPicker = ({ onClose, onAdd, fieldIdx, alreadySelectedProducts, currentFieldData }) => {
    const [availableProducts, setAvailableProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [hasMore, setHasMore] = useState(true);

    const searchRef = useRef(null);
    const debounceRef = useRef(null);
    const page = useRef(1);

    // Filtered list for filtering other selected prodcuts;
    const productList = availableProducts.filter((pro) => {
        if (pro.id === currentFieldData?.id) return true;
        return !alreadySelectedProducts.has(pro.id);
    })

    // We can move this logic into parent component to efficiently fetch store products.
    // We can add abort controllers to efficiently handle stale calls as well.
    const fetchStoreProducts = async ({ flush = true, page = 1, search } = {}) => {
        try {
            if (flush) setLoading(true);
            const results = await fetchProducts({ page, search });

            if (results === null) {
                setHasMore(false);
                if (flush) setAvailableProducts([]);// Revert to empty results if no products
                return;
            }

            if (flush) {
                setAvailableProducts(results);
            } else {
                setAvailableProducts((prev) => [...prev, ...results]);
            }
        } catch (err) {
            console.log(err.message);
            setAvailableProducts((prev) => flush ? [] : prev);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        page.current = 1;// Resetting page to 1
        setHasMore(true);
        fetchStoreProducts({ search, flush: true });
    }, [search])

    useEffect(() => {
        if (currentFieldData?.id && !currentFieldData?.isEmpty) {
            const prodId = currentFieldData?.id;
            const variants = currentFieldData?.variants?.map((variant) => `variant-${prodId}-${variant?.id}`);
            const alreadyAddedIds = [`product-${prodId}`];
            setSelectedIds([...alreadyAddedIds, ...variants]);
        }
    }, [currentFieldData])

    const handleSearchChange = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setSearch(searchRef.current?.value);
        }, 300);// Setting a debounce timeout for search.
    }

    const handleProductSelect = (productId, variantIds) => {
        const ids = [productId, ...(variantIds)];

        setSelectedIds((prev) => {
            if (prev.includes(productId)) {
                return prev.filter((id) => !ids.includes(id));
            }

            return [...prev, ...ids];
        })
    }

    const handleVariantSelect = (variantId, ownerProduct) => {
        const { productId, variantIds } = ownerProduct;

        setSelectedIds((prev) => {
            // uncheck selected variant
            if (prev.includes(variantId)) {
                const next = prev.filter((id) => id !== variantId);

                const hasAnyRelatedVariant = next.some((id) => variantIds.includes(id));
                if (!hasAnyRelatedVariant) return next.filter((id) => id !== productId);

                return next;
            }

            // check selected variant
            if (!prev.includes(productId)) {
                return [...prev, productId, variantId];
            }

            return [...prev, variantId];
        })
    }

    const selectedProducts = useMemo(() => {
        return selectedIds.filter((id) => typeof id === "string" ? id?.includes("product") : false)?.length;
    }, [selectedIds])

    const handleProductsAddition = () => {
        // Create a map from the flat ids array recieved after selection
        const processedData = selectedIds.reduce((acc, id) => {
            const ids = id.split("-");
            const productId = ids[1];

            if (id.includes("product")) {
                acc.set(productId, { productId: productId, variantIds: [] });
                return acc;
            }

            // Handling variants
            const variantId = ids[2];

            if (!acc.has(productId)) {
                acc.set(productId, { productId, variantIds: [] });
            }

            acc.get(productId).variantIds.push(variantId);
            return acc;
        }, new Map());

        // Convert map to array
        const processedArray = Array.from(processedData?.values());

        // Related maps based on all the available products/variants
        const productMap = new Map();
        const variantMap = new Map();

        availableProducts.forEach(product => {
            // eslint-disable-next-line no-unused-vars
            const { variants, ...rest } = product;
            productMap.set(product.id, rest);

            product.variants.forEach(variant => {
                variantMap.set(variant.id, {
                    ...variant,
                    productId: product.id
                });
            });
        });

        // Create the final array to shift to selected product array
        const finalArray = processedArray.map(({ productId, variantIds }) => ({
            ...(productMap.get(+productId)),
            variants: variantIds.map((variantId) => (variantMap.get(+variantId)))
        }));

        onAdd(finalArray, fieldIdx);
        onClose();
    }

    const dataLength = productList.length;

    return (
        <div className={styles.picker}>
            <div className={styles.picker__header}>
                <h2>Select Products</h2>
                <button className={styles.cta__close} onClick={onClose}></button>
            </div>

            <div className={styles.picker__search}>
                <div className={styles.search__container}>
                    <span className={styles.search__icon}></span>
                    <input
                        type="search"
                        className={styles.search__field}
                        placeholder="Search Products"
                        ref={searchRef}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className={styles.picker__products} id="picker-scroll-container">
                <InfiniteScroll
                    dataLength={dataLength} //This is important field to render the next data
                    next={() => {
                        if (loading || !hasMore) return;

                        const nextPage = page.current + 1;
                        const currentSearch = searchRef.current?.value || "";
                        fetchStoreProducts({ flush: false, page: nextPage, search: currentSearch });
                        page.current = nextPage;
                    }}
                    hasMore={hasMore}
                    triggerThreshold={0.5}
                    scrollableTarget="picker-scroll-container"
                >
                    {loading
                        ? <p className={styles["helper-text"]}>Loading...</p>
                        :
                        (productList?.length > 0 ?
                            productList?.map((prod) =>
                                <Product
                                    details={prod}
                                    key={prod.id}
                                    onProductSelect={handleProductSelect}
                                    onVariantSelect={handleVariantSelect}
                                    selectedIds={selectedIds}
                                />
                            )
                            : <p className={styles["helper-text"]}>No products found</p>
                        )}
                </InfiniteScroll>
            </div>

            <div className={styles.picker__footer}>
                <span>{selectedProducts} product{selectedProducts > 1 ? "s" : ""} selected</span>

                <div className={styles.cta__container}>
                    <button
                        className={styles.cta__cancel}
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={`btn small-filled ${styles.cta__add}`}
                        onClick={handleProductsAddition}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div >
    )
}

export default ProductPicker;