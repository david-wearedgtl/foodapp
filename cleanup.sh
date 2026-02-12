# 1. Clean JavaScript environment
echo "--- 1. Cleaning JavaScript Environment ---"
rm -rf node_modules
rm -f package-lock.json yarn.lock

# 2. Reinstall JS dependencies
echo "--- 2. Reinstalling JS Dependencies ---"
npm install

# 3. Clean CocoaPods and iOS build artifacts
echo "--- 3. Deep Cleaning iOS Artifacts ---"
cd ios
# Remove Pods folder, Podfile.lock, and Xcode build folder
rm -rf Pods
rm -f Podfile.lock
rm -rf build

# 4. Critical Step: Clean Xcode Derived Data
# NOTE: This command assumes standard derived data location. If issues persist,
# manually delete the contents of ~/Library/Developer/Xcode/DerivedData/
echo "--- 4. Cleaning Derived Data ---"
xcodebuild clean -configuration Debug

# 5. Reinstall native dependencies
echo "--- 5. Reinstalling Native Pods ---"
pod install --repo-update
cd ..

# 6. Clear Metro Cache (Final Clean)
echo "--- 6. Clearing Metro Cache ---"
npm start -- --reset-cache

