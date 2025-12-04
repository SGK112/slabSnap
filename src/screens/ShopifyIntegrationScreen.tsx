/**
 * REMODELY.AI - Shopify Integration Screen
 * Simple OAuth-based Shopify connection - no API keys needed!
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Linking,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/colors';
import { useShopifyStore } from '../state/shopifyStore';
import { useAuthStore } from '../state/authStore';
import { ShopifyProduct } from '../types/shopify';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { API_CONFIG } from '../config/env';

export default function ShopifyIntegrationScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const token = user?.id || '';
  const {
    isConnected,
    store,
    isConnecting,
    connectionError,
    products,
    productsLoading,
    isSyncing,
    syncStatus,
    disconnect,
    checkStatus,
    fetchProducts,
    importProduct,
    syncAll,
  } = useShopifyStore();

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [storeName, setStoreName] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (token) {
      checkStatus(token);
    }
  }, [token]);

  useEffect(() => {
    if (isConnected && token && products.length === 0) {
      fetchProducts(token);
    }
  }, [isConnected, token]);

  // OAuth connect - requires store name
  const handleConnectShopify = async () => {
    // Validate store name
    const cleanStore = storeName.trim().toLowerCase().replace(/\.myshopify\.com$/, '');

    if (!cleanStore) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Store Name Required', 'Please enter your Shopify store name');
      return;
    }

    Keyboard.dismiss();
    setIsAuthenticating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Get OAuth URL from backend
      const response = await fetch(
        `${API_CONFIG.baseUrl}/api/shopify/auth/url?shop=${encodeURIComponent(cleanStore)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || 'Could not get authorization URL');
      }

      // Open OAuth flow in browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'remodely://shopify-callback'
      );

      // Check status after OAuth completes
      if (result.type === 'success' || result.type === 'dismiss') {
        // Give backend time to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        await checkStatus(token);

        // Re-check after status update
        const statusCheck = await fetch(
          `${API_CONFIG.baseUrl}/api/shopify/status`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const statusData = await statusCheck.json();

        if (statusData.connected) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Connected!', `Your Shopify store "${statusData.store?.name || cleanStore}" is now connected.`);
        }
      }
    } catch (error: any) {
      console.error('Shopify connect error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection Error', error.message || 'Unable to connect. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Store',
      'Are you sure you want to disconnect your Shopify store?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (token) {
              await disconnect(token);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchProducts(token, true);
    setRefreshing(false);
  };

  const handleImportSelected = async () => {
    if (!token || selectedProducts.size === 0) return;

    Alert.alert(
      'Import Products',
      `Import ${selectedProducts.size} product(s) to Remodely?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            try {
              for (const productId of selectedProducts) {
                await importProduct(token, productId);
              }
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `Imported ${selectedProducts.size} product(s)`);
              setSelectedProducts(new Set());
            } catch (error) {
              Alert.alert('Import Failed', 'Some products could not be imported');
            }
          },
        },
      ]
    );
  };

  const handleSyncAll = async () => {
    if (!token) return;
    try {
      await syncAll(token, 'both');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Sync Failed', 'Could not complete sync');
    }
  };

  const toggleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProducts(newSelection);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Not connected - Connect screen with store name input
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>Shopify</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.connectContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Shopify Logo */}
                <View style={styles.logoContainer}>
                  <View style={styles.shopifyLogo}>
                    <Ionicons name="bag-handle" size={60} color="#95BF47" />
                  </View>
                </View>

                <Text style={styles.connectTitle}>Connect Your Shopify Store</Text>
                <Text style={styles.connectSubtitle}>
                  Login with Shopify OAuth - no API keys needed!
                </Text>

                {/* Store Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Your Store Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.storeInput}
                      placeholder="mystore"
                      placeholderTextColor="#9ca3af"
                      value={storeName}
                      onChangeText={setStoreName}
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleConnectShopify}
                      onFocus={() => {
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 200);
                      }}
                    />
                    <Text style={styles.inputSuffix}>.myshopify.com</Text>
                  </View>
                  <Text style={styles.inputHint}>
                    Enter the name from your Shopify URL
                  </Text>
                </View>

                {connectionError && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={20} color="#dc2626" />
                    <Text style={styles.errorText}>{connectionError}</Text>
                  </View>
                )}

                {/* Connect Button */}
                <Pressable
                  style={[
                    styles.connectButton,
                    (isAuthenticating || isConnecting || !storeName.trim()) && styles.connectButtonDisabled
                  ]}
                  onPress={handleConnectShopify}
                  disabled={isAuthenticating || isConnecting}
                >
                  {isAuthenticating || isConnecting ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text style={styles.connectButtonText}>Connecting...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={24} color="white" />
                      <Text style={styles.connectButtonText}>Connect with Shopify</Text>
                    </>
                  )}
                </Pressable>

                <View style={styles.securityNote}>
                  <Ionicons name="lock-closed" size={16} color={colors.text.tertiary} />
                  <Text style={styles.securityNoteText}>
                    Secure OAuth login - we never see your password
                  </Text>
                </View>

                {/* Benefits - compact */}
                <View style={styles.benefitsRow}>
                  <View style={styles.benefitChip}>
                    <Ionicons name="sync" size={16} color="#95BF47" />
                    <Text style={styles.benefitChipText}>Auto sync</Text>
                  </View>
                  <View style={styles.benefitChip}>
                    <Ionicons name="cube" size={16} color="#95BF47" />
                    <Text style={styles.benefitChipText}>Products</Text>
                  </View>
                  <View style={styles.benefitChip}>
                    <Ionicons name="receipt" size={16} color="#95BF47" />
                    <Text style={styles.benefitChipText}>Orders</Text>
                  </View>
                </View>

                {/* Help link */}
                <Pressable
                  onPress={() => Linking.openURL('https://www.shopify.com/')}
                  style={styles.helpLink}
                >
                  <Text style={styles.helpLinkText}>Don't have a Shopify store?</Text>
                  <Ionicons name="open-outline" size={14} color="#95BF47" />
                </Pressable>

                {/* Extra padding for keyboard */}
                <View style={{ height: 100 }} />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Connected view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Shopify</Text>
        <Pressable onPress={handleSyncAll} disabled={isSyncing} style={styles.syncButton}>
          {isSyncing ? (
            <ActivityIndicator size="small" color="#95BF47" />
          ) : (
            <Ionicons name="sync" size={24} color="#95BF47" />
          )}
        </Pressable>
      </View>

      {/* Store Card */}
      <View style={styles.storeCard}>
        <View style={styles.storeCardHeader}>
          <View style={styles.storeIconContainer}>
            <Ionicons name="bag-handle" size={32} color="#95BF47" />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store?.name || 'Your Store'}</Text>
            <Text style={styles.storeDomain}>{store?.domain}</Text>
          </View>
          <View style={styles.connectedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{store?.productCount || products.length}</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{syncStatus.productsImported}</Text>
            <Text style={styles.statLabel}>Imported</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{syncStatus.productsExported}</Text>
            <Text style={styles.statLabel}>Exported</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['products', 'orders', 'settings'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {selectedProducts.size > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>{selectedProducts.size} selected</Text>
              <Pressable style={styles.importButton} onPress={handleImportSelected}>
                <Ionicons name="download" size={18} color="white" />
                <Text style={styles.importButtonText}>Import</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            style={styles.productsList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            {productsLoading && products.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#95BF47" />
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={56} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Products Yet</Text>
                <Text style={styles.emptySubtitle}>Your Shopify products will appear here</Text>
              </View>
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProducts.has(product.shopifyId)}
                  onSelect={() => toggleProductSelection(product.shopifyId)}
                />
              ))
            )}
          </ScrollView>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={56} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>Orders Coming Soon</Text>
          <Text style={styles.emptySubtitle}>Order management will be available soon</Text>
        </View>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.settingsList}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Connection</Text>
            <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
              <Ionicons name="unlink" size={22} color="#dc2626" />
              <Text style={styles.disconnectButtonText}>Disconnect Store</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ProductCard({
  product,
  isSelected,
  onSelect,
}: {
  product: ShopifyProduct;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[styles.productCard, isSelected && styles.productCardSelected]}
      onPress={onSelect}
    >
      <View style={styles.productCheckbox}>
        <Ionicons
          name={isSelected ? 'checkbox' : 'square-outline'}
          size={26}
          color={isSelected ? '#95BF47' : colors.text.tertiary}
        />
      </View>

      {product.images[0] ? (
        <Image source={{ uri: product.images[0].src }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image-outline" size={28} color={colors.text.tertiary} />
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
        <Text style={styles.productPrice}>${product.variants[0]?.price || '0.00'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  syncButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  connectContent: {
    padding: 24,
    alignItems: 'center',
  },
  logoContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  shopifyLogo: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#95BF47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  connectTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  connectSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 52,
  },
  storeInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  inputSuffix: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
    marginLeft: 4,
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 16,
  },
  benefitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  benefitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#166534',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#95BF47',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#95BF47',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 12,
  },
  helpLinkText: {
    fontSize: 15,
    color: '#95BF47',
    fontWeight: '600',
  },
  storeCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  storeDomain: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 4,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#95BF47',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#95BF47',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
  },
  selectionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#95BF47',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#95BF47',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  productsList: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  productCardSelected: {
    backgroundColor: '#f0fdf4',
  },
  productCheckbox: {
    marginRight: 14,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 14,
  },
  productImagePlaceholder: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#95BF47',
  },
  settingsList: {
    flex: 1,
    backgroundColor: 'white',
  },
  settingsSection: {
    padding: 20,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 14,
  },
  disconnectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
