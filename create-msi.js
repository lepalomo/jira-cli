#!/usr/bin/env node

/**
 * Script to create MSI installer for Jira CLI
 * Requires WiX Toolset installed on Windows
 * Run: node create-msi.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Creating MSI installer for Jira CLI...');

// Create directory structure
const msiDir = path.join(__dirname, 'msi');
const distDir = path.join(__dirname, 'dist');
const wxsFile = path.join(msiDir, 'jira-cli.wxs');
const wixobjFile = path.join(msiDir, 'jira-cli.wixobj');
const msiFile = path.join(distDir, 'jira-cli.msi');

// Ensure directories exist
if (!fs.existsSync(msiDir)) fs.mkdirSync(msiDir, { recursive: true });
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// Check if pkg executable exists
const exePath = path.join(distDir, 'jira-cli.exe');
if (!fs.existsSync(exePath)) {
    console.error('Error: jira-cli.exe not found in dist directory.');
    console.error('Run "npm run build:win" first to create the executable.');
    process.exit(1);
}

// Create WiX XML file
const wxsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
    <Product Id="*" 
             Name="Jira CLI" 
             Language="1033" 
             Version="1.0.0" 
             Manufacturer="Your Company" 
             UpgradeCode="YOUR-GUID-HERE-1234567890AB">
        
        <Package InstallerVersion="200" 
                 Compressed="yes" 
                 InstallScope="perMachine" />
        
        <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
        
        <MediaTemplate EmbedCab="yes" />
        
        <Feature Id="ProductFeature" Title="Jira CLI" Level="1">
            <ComponentGroupRef Id="ProductComponents" />
        </Feature>
        
        <UI>
            <UIRef Id="WixUI_Minimal" />
            <Publish Dialog="ExitDialog" 
                     Control="Finish" 
                     Event="DoAction" 
                     Value="LaunchApplication">WIXUI_EXITDIALOGOPTIONALCHECKBOX = 1 and NOT Installed</Publish>
        </UI>
        
        <Property Id="WIXUI_EXITDIALOGOPTIONALCHECKBOXTEXT" Value="Launch Jira CLI" />
        <Property Id="WixShellExecTarget" Value="[INSTALLFOLDER]jira-cli.exe" />
        <CustomAction Id="LaunchApplication" 
                      BinaryKey="WixCA" 
                      DllEntry="WixShellExec" 
                      Impersonate="yes" />
    </Product>
    
    <Fragment>
        <Directory Id="TARGETDIR" Name="SourceDir">
            <Directory Id="ProgramFilesFolder">
                <Directory Id="INSTALLFOLDER" Name="JiraCLI" />
            </Directory>
            <Directory Id="ProgramMenuFolder">
                <Directory Id="ApplicationProgramsFolder" Name="JiraCLI" />
            </Directory>
        </Directory>
    </Fragment>
    
    <Fragment>
        <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
            <Component Id="MainExecutable" Guid="YOUR-GUID-HERE-1234567890AC">
                <File Id="JiraCLIExe" 
                      Source="${exePath.replace(/\\/g, '\\\\')}" 
                      KeyPath="yes" 
                      Checksum="yes" />
                <Shortcut Id="StartMenuShortcut" 
                          Directory="ApplicationProgramsFolder" 
                          Name="Jira CLI" 
                          WorkingDirectory="INSTALLFOLDER"
                          Icon="JiraCLIExe"
                          Arguments="--help"
                          Show="normal" />
                <RegistryValue Root="HKCU" 
                               Key="Software\\JiraCLI" 
                               Name="installed" 
                               Type="integer" 
                               Value="1" 
                               KeyPath="no" />
            </Component>
        </ComponentGroup>
    </Fragment>
</Wix>`;

fs.writeFileSync(wxsFile, wxsContent);
console.log(`Created WiX source file: ${wxsFile}`);

console.log('\nTo create MSI installer manually:');
console.log('1. Install WiX Toolset from: https://wixtoolset.org/');
console.log('2. Run the following commands:');
console.log(`   cd "${msiDir}"`);
console.log('   candle.exe jira-cli.wxs');
console.log('   light.exe jira-cli.wixobj -out ../dist/jira-cli.msi');
console.log('\nOr use Inno Setup for simpler installer creation.');
console.log('\nAlternative: Use electron-builder for advanced packaging options.');