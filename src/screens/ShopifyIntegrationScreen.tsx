/**
 * REMODELY.AI - Shopify Integration Screen
 * Allows users to connect and manage their Shopify store via OAuth
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Linking,
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
import * as AuthSession from 'expo-auth-session';
import { API_CONFIG } from '../config/env';

export default function ShopifyIntegrationScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  // Use user ID as mock auth token for demo purposes
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
    connect,
    disconnect,
    checkStatus,
    fetchProducts,
    importProduct,
    syncAll,
    clearError,
  } = useShopifyStore();

  const [storeDomain, setStoreDomain] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Get the redirect URI for OAuth callback
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'remodely',
    path: 'shopify-callback',
  });

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

  // Handle OAuth login with Shopify
  const handleShopifyLogin = async () => {
    if (!storeDomain.trim()) {
      Alert.alert('Store Name Required', 'Please enter your Shopify store name to continue');
      return;
    }

    // Clean up domain
    let cleanDomain = storeDomain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '');
    cleanDomain = cleanDomain.replace(/\/$/, '');
    cleanDomain = cleanDomain.replace('.myshopify.com', '');

    setIsAuthenticating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // First, get the OAuth URL from the backend (which generates the state token)
      const response = await fetch(`${API_CONFIG.baseUrl}/api/shopify/auth/url?shop=${cleanDomain}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get OAuth URL');
      }

      const data = await response.json();

      if (!data.success || !data.url) {
        throw new Error(data.message || 'Invalid OAuth response');
      }

      // Open the Shopify OAuth URL in a web browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type === 'success' && result.url) {
        // The callback page shows success/error - check connection status
        await checkStatus(token);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Connected!', 'Your Shopify store has been connected successfully.');
        setStoreDomain('');
      } else if (result.type === 'cancel') {
        // User cancelled
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Shopify OAuth error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection Error', error instanceof Error ? error.message : 'Unable to connect to Shopify. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Store',
      'Are you sure you want to disconnect your Shopify store? Your synced products will remain in Remodely.',
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
              Alert.alert('Success', `Imported ${selectedProducts.size} product(s) to Remodely`);
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

    Alert.alert(
      'Sync Products',
      'Sync all products between Shopify and Remodely?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync',
          onPress: async () => {
            try {
              await syncAll(token, 'both');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Sync Failed', 'Could not complete sync');
            }
          },
        },
      ]
    );
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

  const openShopifyHelp = () => {
    Linking.openURL('https://www.shopify.com/');
  };

  // Not connected view - Simple OAuth login
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Shopify Integration</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.connectContent}>
          {/* Shopify Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.shopifyLogo}>
              <Ionicons name="bag-handle" size={64} color="#95BF47" />
            </View>
          </View>

          <Text style={styles.connectTitle}>Connect Your Shopify Store</Text>
          <Text style={styles.connectSubtitle}>
            Sync your stone inventory between Remodely and your Shopify store. Just enter your store name and log in with Shopify.
          </Text>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="sync" size={22} color="#95BF47" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Two-Way Sync</Text>
                <Text style={styles.featureDescription}>Keep inventory in sync automatically</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="cloud-upload" size={22} color="#95BF47" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Easy Import</Text>
                <Text style={styles.featureDescription}>Import products to Remodely listings</Text>
              </View>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="shield-checkmark" size={22} color="#95BF47" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Secure OAuth</Text>
                <Text style={styles.featureDescription}>Login securely with your Shopify account</Text>
              </View>
            </View>
          </View>

          {/* Simple Store Name Input + OAuth Button */}
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Your Shopify Store Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="your-store-name"
                placeholderTextColor={colors.text.tertiary}
                value={storeDomain}
                onChangeText={setStoreDomain}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Text style={styles.inputSuffix}>.myshopify.com</Text>
            </View>

            <Text style={styles.helperText}>
              Enter just your store name (e.g., "my-stone-shop")
            </Text>

            {connectionError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{connectionError}</Text>
              </View>
            )}

            {/* OAuth Login Button */}
            <Pressable
              style={[
                styles.connectButton,
                (isAuthenticating || isConnecting || !storeDomain.trim()) && styles.connectButtonDisabled,
              ]}
              onPress={handleShopifyLogin}
              disabled={isAuthenticating || isConnecting || !storeDomain.trim()}
            >
              {isAuthenticating || isConnecting ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={styles.connectButtonText}>Connecting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={22} color="white" />
                  <Text style={styles.connectButtonText}>Login with Shopify</Text>
                </>
              )}
            </Pressable>

            {/* Shopify branding note */}
            <View style={styles.securityNote}>
              <Ionicons name="lock-closed" size={14} color={colors.text.tertiary} />
              <Text style={styles.securityNoteText}>
                You'll be redirected to Shopify to authorize this app securely
              </Text>
            </View>
          </View>

          {/* Don't have a store? */}
          <Pressable onPress={openShopifyHelp} style={styles.createStoreLink}>
            <Text style={styles.createStoreLinkText}>Don't have a Shopify store? </Text>
            <Text style={[styles.createStoreLinkText, { color: '#95BF47', fontWeight: '600' }]}>
              Create one
            </Text>
            <Ionicons name="open-outline" size={14} color="#95BF47" style={{ marginLeft: 4 }} />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Connected view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Shopify</Text>
        <Pressable onPress={handleSyncAll} disabled={isSyncing}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Ionicons name="sync" size={24} color={colors.primary[600]} />
          )}
        </Pressable>
      </View>

      {/* Store Info Card */}
      <View style={styles.storeCard}>
        <View style={styles.storeCardHeader}>
          <View style={styles.storeIconContainer}>
            <Ionicons name="bag-handle" size={28} color="#95BF47" />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store?.name || 'Your Store'}</Text>
            <Text style={styles.storeDomain}>{store?.domain}</Text>
          </View>
          <View style={styles.connectedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        </View>

        {/* Stats */}
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
        <Pressable
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Products
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </Pressable>
      </View>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          {selectedProducts.size > 0 && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {selectedProducts.size} selected
              </Text>
              <Pressable style={styles.importButton} onPress={handleImportSelected}>
                <Ionicons name="download" size={18} color="white" />
                <Text style={styles.importButtonText}>Import to Remodely</Text>
              </Pressable>
            </View>
          )}

          <ScrollView
            style={styles.productsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {productsLoading && products.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.loadingText}>Loading products...</Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color={colors.text.tertiary} />
                <Text style={styles.emptyTitle}>No Products</Text>
                <Text style={styles.emptySubtitle}>
                  Your Shopify store doesn't have any active products
                </Text>
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
        <View style={styles.comingSoonContainer}>
          <Ionicons name="receipt-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.comingSoonTitle}>Orders Coming Soon</Text>
          <Text style={styles.comingSoonSubtitle}>
            Order management will be available in a future update
          </Text>
        </View>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.settingsList}>
          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Sync Settings</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-sync inventory</Text>
                <Text style={styles.settingDescription}>
                  Automatically sync inventory changes
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sync frequency</Text>
                <Text style={styles.settingDescription}>
                  How often to sync with Shopify
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.settingsSectionTitle}>Store Connection</Text>

            <Pressable style={styles.disconnectButton} onPress={handleDisconnect}>
              <Ionicons name="unlink" size={20} color="#dc2626" />
              <Text style={styles.disconnectButtonText}>Disconnect Store</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Product Card Component
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
          size={24}
          color={isSelected ? colors.primary[600] : colors.text.tertiary}
        />
      </View>

      {product.images[0] ? (
        <Image source={{ uri: product.images[0].src }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color={colors.text.tertiary} />
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.productType}>{product.productType || 'No type'}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>
            ${product.variants[0]?.price || '0.00'}
          </Text>
          {product.syncedToRemodely && (
            <View style={styles.syncedBadge}>
              <Ionicons name="checkmark" size={12} color="#10b981" />
              <Text style={styles.syncedBadgeText}>Synced</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  connectContent: {
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shopifyLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  connectSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  featuresContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  formContainer: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.border.main,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    color: colors.text.primary,
    flex: 1,
  },
  inputSuffix: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  helpLinkText: {
    fontSize: 13,
    color: colors.primary[600],
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#95BF47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  connectButtonDisabled: {
    opacity: 0.7,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  helperText: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: -8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  securityNoteText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  createStoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 12,
  },
  createStoreLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  storeCard: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  storeDomain: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary[100],
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  productsList: {
    flex: 1,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: 'white',
  },
  productCardSelected: {
    backgroundColor: colors.primary[50],
  },
  productCheckbox: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productType: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  syncedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  settingsList: {
    flex: 1,
  },
  settingsSection: {
    padding: 16,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  comingSoonBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
  },
  disconnectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
});
