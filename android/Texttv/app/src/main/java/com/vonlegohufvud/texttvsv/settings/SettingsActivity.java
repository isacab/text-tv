package com.vonlegohufvud.texttvsv.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.preference.PreferenceFragmentCompat;

import static androidx.preference.PreferenceManager.*;

import android.view.MenuItem;

import com.vonlegohufvud.texttvsv.R;

public class SettingsActivity extends AppCompatActivity implements SharedPreferences.OnSharedPreferenceChangeListener {

  private Intent mResultIntent = new Intent();

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(getLayoutId());
    getSupportFragmentManager()
      .beginTransaction()
      .replace(R.id.settings, getPreferenceFragment())
      .commit();

    initToolbar();

    mResultIntent.putExtra("changed", false);
    setResult(RESULT_CANCELED, mResultIntent);
  }

  protected int getLayoutId() {
    return R.layout.settings_activity;
  }

  protected PreferenceFragmentCompat getPreferenceFragment() {
    return new SettingsFragment();
  }

  protected void initToolbar() {
    Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
    setSupportActionBar(toolbar);
    if (getSupportActionBar() != null){
      getSupportActionBar().setDisplayHomeAsUpEnabled(true);
      getSupportActionBar().setDisplayShowHomeEnabled(true);
    }
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
    if(!mResultIntent.getBooleanExtra("changed", false)) {
      mResultIntent.putExtra("changed", true);
      setResult(RESULT_OK, mResultIntent);
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
