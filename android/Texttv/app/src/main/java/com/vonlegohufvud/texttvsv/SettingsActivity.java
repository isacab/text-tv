package com.vonlegohufvud.texttvsv;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.preference.PreferenceFragmentCompat;

import static androidx.preference.PreferenceManager.*;

import android.view.MenuItem;

public class SettingsActivity extends AppCompatActivity implements SharedPreferences.OnSharedPreferenceChangeListener {

  private Intent resultIntent = new Intent();

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.settings_activity);
    getSupportFragmentManager()
      .beginTransaction()
      .replace(R.id.settings, new SettingsFragment())
      .commit();

    Toolbar toolbar = (Toolbar) findViewById(R.id.settingsToolbar);
    setSupportActionBar(toolbar);
    if (getSupportActionBar() != null){
      getSupportActionBar().setDisplayHomeAsUpEnabled(true);
      getSupportActionBar().setDisplayShowHomeEnabled(true);
    }

    resultIntent.putExtra("changed", false);
    setResult(RESULT_CANCELED, resultIntent);
  }

  public static class SettingsFragment extends PreferenceFragmentCompat {
    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
      setPreferencesFromResource(R.xml.root_preferences, rootKey);
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
