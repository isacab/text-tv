package com.vonlegohufvud.texttvsv.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.MenuItem;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;

import com.vonlegohufvud.texttvsv.R;

import static androidx.preference.PreferenceManager.getDefaultSharedPreferences;

public class SettingsActivityNested extends AppCompatActivity implements
  PreferenceFragmentCompat.OnPreferenceStartFragmentCallback, SharedPreferences.OnSharedPreferenceChangeListener {

  private static final String TITLE_TAG = "Inställningar";

  private Intent resultIntent = new Intent();
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.settings_activity);
    if (savedInstanceState == null) {
      getSupportFragmentManager()
        .beginTransaction()
        .replace(R.id.settings, new HeaderFragment())
        .commit();
    } else {
      setTitle(savedInstanceState.getCharSequence(TITLE_TAG));
    }
    getSupportFragmentManager().addOnBackStackChangedListener(
      new FragmentManager.OnBackStackChangedListener() {
        @Override
        public void onBackStackChanged() {
          if (getSupportFragmentManager().getBackStackEntryCount() == 0) {
            setTitle(R.string.title_activity_settings);
          }
        }
      });

    Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
    setSupportActionBar(toolbar);
    if (getSupportActionBar() != null){
      getSupportActionBar().setDisplayHomeAsUpEnabled(true);
      getSupportActionBar().setDisplayShowHomeEnabled(true);
    }

    resultIntent.putExtra("changed", false);
    setResult(RESULT_CANCELED, resultIntent);
  }

  @Override
  public void onSaveInstanceState(Bundle outState) {
    super.onSaveInstanceState(outState);
    // Save current activity title so we can set it again after a configuration change
    outState.putCharSequence(TITLE_TAG, getTitle());
  }

  @Override
  public boolean onSupportNavigateUp() {
    if (getSupportFragmentManager().popBackStackImmediate()) {
      return true;
    }
    return super.onSupportNavigateUp();
  }

  @Override
  public boolean onPreferenceStartFragment(PreferenceFragmentCompat caller, Preference pref) {
    // Instantiate the new Fragment
    final Bundle args = pref.getExtras();
    final Fragment fragment = getSupportFragmentManager().getFragmentFactory().instantiate(
      getClassLoader(),
      pref.getFragment());
    fragment.setArguments(args);
    fragment.setTargetFragment(caller, 0);
    // Replace the existing Fragment with the new Fragment
    getSupportFragmentManager().beginTransaction()
      .replace(R.id.settings, fragment)
      .addToBackStack(null)
      .commit();
    setTitle(pref.getTitle());
    return true;
  }

  public static class HeaderFragment extends PreferenceFragmentCompat {

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
      setPreferencesFromResource(R.xml.header_preferences, rootKey);
    }
  }

  public static class AppearanceFragment extends PreferenceFragmentCompat {

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
      setPreferencesFromResource(R.xml.appearance_preferences, rootKey);
    }
  }

  @Override
  protected void onResume() {
    super.onResume();
    getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(this);
  }

  @Override
  protected void onPause() {
    super.onPause();
    getDefaultSharedPreferences(this).unregisterOnSharedPreferenceChangeListener(this);
  }

  @Override
  public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
    if(!resultIntent.getBooleanExtra("changed", false)) {
      resultIntent.putExtra("changed", true);
      setResult(RESULT_OK, resultIntent);
    }
  }

  @Override
  public boolean onOptionsItemSelected(MenuItem item) {
    int id  = item.getItemId();
    if (id == android.R.id.home) {
      finish();
      return true;
    }
    return super.onOptionsItemSelected(item);
  }
}
